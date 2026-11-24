import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/sequelize';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { QueryInterface, Sequelize } from 'sequelize';
import { SequelizeStorage, Umzug } from 'umzug';
import { ConnectionNames } from '../../../databases/connection-names.js';
import { DatabaseConnectionConfig } from '../../../environment/environment-types.interface.js';

type MigrationStep = (
  queryInterface: QueryInterface,
  sequelize: typeof Sequelize,
) => Promise<unknown>;

interface MigrationModule {
  default?: { up: MigrationStep; down?: MigrationStep };
  up?: MigrationStep;
  down?: MigrationStep;
}

export interface MigrationFile {
  /** Name stored in SequelizeMeta; always the `.ts` source name */
  name: string;
  path: string;
}

/**
 * Lists the migrations in `directory`, from `src` (`.ts`) or a build (`.js`).
 *
 * SequelizeMeta records the `.ts` source name. Compiled `.js` files are reported
 * under that same name, so a build does not see every migration as pending.
 */
export const listMigrationFiles = (directory: string): MigrationFile[] =>
  readdirSync(directory)
    .filter((file) => /\.(ts|js)$/.test(file) && !file.endsWith('.d.ts'))
    .map((file) => ({
      name: file.replace(/\.js$/, '.ts'),
      path: join(directory, file),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

/**
 * Builds the umzug migrator shared by migration:run / rollback / refresh.
 * Migrations are ES modules: `export default { up, down }`.
 */
@Injectable()
export class MigratorFactoryService {
  constructor(
    private readonly logger: Logger,
    private readonly config: ConfigService,
    @InjectConnection() private readonly connection: Sequelize,
  ) {}

  public create(
    connectionName: ConnectionNames = ConnectionNames.DefaultConnection,
  ): Umzug<QueryInterface> {
    const { migrationDirectory } =
      this.config.getOrThrow<Record<ConnectionNames, DatabaseConnectionConfig>>(
        'databases',
      )[connectionName];

    return new Umzug({
      migrations: listMigrationFiles(migrationDirectory).map(
        ({ name, path }) => ({
          name,
          path,
          up: async ({ context }) =>
            (await this.load(path)).up(context, Sequelize),
          down: async ({ context }) => {
            const { down } = await this.load(path);
            if (!down) {
              throw new Error(`Migration ${name} has no down step`);
            }
            return down(context, Sequelize);
          },
        }),
      ),
      context: this.connection.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize: this.connection }),
      logger: this.logger as never,
    });
  }

  /**
   * Every migration name recorded in SequelizeMeta, including ones whose file no longer exists
   * (umzug's executed() leaves those out)
   */
  public executedNames(): Promise<string[]> {
    return new SequelizeStorage({ sequelize: this.connection }).executed();
  }

  private async load(
    path: string,
  ): Promise<{ up: MigrationStep; down?: MigrationStep }> {
    const migration = (await import(
      pathToFileURL(path).href
    )) as MigrationModule;
    const steps = migration.default ?? migration;
    if (!steps.up) {
      throw new Error(`Migration ${path} does not export an up step`);
    }
    return { up: steps.up, down: steps.down };
  }
}
