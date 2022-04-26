import { Injectable } from '@nestjs/common';
import { Command } from 'nestjs-command';
import { ConnectionNames } from '../../../databases/connection-names';
import { DatabaseConnectionConfig } from '../../../environment/interfaces/environment-types.interface';
import { SequelizeStorage, Umzug } from 'umzug';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import { LoggingService } from '../../../services/logging/logging.service';

@Injectable()
export class RunMigrationService {
  constructor(
    private logger: LoggingService,
    private config: ConfigService,
    @InjectConnection() private connection: Sequelize,
  ) {}

  @Command({
    command: 'migration:run',
    describe: 'Runs all pending migrations',
    autoExit: true,
  })
  public async runMigration(
    connectionName: ConnectionNames = ConnectionNames.DefaultConnection,
  ) {
    const connectionConfig =
      this.config.get<Record<ConnectionNames, DatabaseConnectionConfig>>(
        'databases',
      )[connectionName];

    const umzug = new Umzug({
      migrations: {
        glob: `${connectionConfig.migrationDirectory}/*.ts`,
        resolve: ({ name, path, context }) => {
          // const migration = (require as any)(path);
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
    return umzug.up();
  }
}
