import { Injectable, Logger } from '@nestjs/common';
import { ConnectionNames } from '../../../databases/connection-names';
import { DatabaseConnectionConfig } from '../../../environment/environment-types.interface';
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
  public async rollbackMigration(
    connectionName: ConnectionNames = ConnectionNames.DefaultConnection,
    till?: number,
  ) {
    const connectionConfig =
      this.config.getOrThrow<Record<ConnectionNames, DatabaseConnectionConfig>>(
        'databases',
      )[connectionName];

    const umzug = new Umzug({
      migrations: {
        glob: `${connectionConfig.migrationDirectory}/*.ts`,
        resolve: ({ name, path, context }) => {
          return {
            name,
            up: async () =>
              import(path as string).then(
                (migration: { up: (...args: unknown[]) => Promise<unknown> }) =>
                  migration.up(context, this.connection.Sequelize),
              ),
            down: async () =>
              import(path as string).then(
                (migration: {
                  default: { down: (...args: unknown[]) => Promise<unknown> };
                }) =>
                  migration.default.down(context, this.connection.Sequelize),
              ),
          };
        },
      },
      context: this.connection.getQueryInterface(),
      storage: new SequelizeStorage({ sequelize: this.connection }),
      logger: this.logger as never,
    });
    return umzug.down({ step: typeof till === 'number' ? till : 1 });
  }
}
