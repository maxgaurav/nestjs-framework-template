import { Injectable, Logger } from '@nestjs/common';
import { Command, Option } from 'nestjs-command';
import { ConnectionNames } from '../../../databases/connection-names';
import { DatabaseConnectionConfig } from '../../../environment/interfaces/environment-types.interface';
import { SequelizeStorage, Umzug } from 'umzug';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';

@Injectable()
export class RollbackMigrationService {
  constructor(
    private logger: Logger,
    private config: ConfigService,
    @InjectConnection() private connection: Sequelize,
  ) {}

  @Command({
    command: 'migration:rollback',
    describe:
      'Roll back last migration or till the migration point provided as till',
  })
  public async rollbackMigration(
    connectionName: ConnectionNames = ConnectionNames.DefaultConnection,
    @Option({
      name: 'till',
      describe: 'Number of migrations to rollback',
      default: '',
      demandOption: false,
      type: 'string',
    })
    till?: number | undefined,
  ) {
    const connectionConfig =
      this.config.get<Record<ConnectionNames, DatabaseConnectionConfig>>(
        'databases',
      )[connectionName];

    const umzug = new Umzug({
      migrations: {
        glob: `${connectionConfig.migrationDirectory}/*.ts`,
        resolve: ({ name, path, context }) => {
          return {
            name,
            up: async () =>
              import(path).then((migration) =>
                migration.up(context, this.connection.Sequelize),
              ),
            down: async () =>
              import(path).then((migration) =>
                migration.down(context, this.connection.Sequelize),
              ),
          };
        },
      },
      context: this.connection.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize: this.connection }),
      logger: this.logger as any,
    });
    return umzug.down({ step: typeof till === 'number' ? till : 1 });
  }
}
