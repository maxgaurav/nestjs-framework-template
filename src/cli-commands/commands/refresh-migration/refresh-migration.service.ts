import { Injectable, Logger } from '@nestjs/common';
import { Command, Option } from 'nestjs-command';
import { ConnectionNames } from '../../../databases/connection-names';
import { DropDatabaseService } from '../drop-database/drop-database.service';
import { CreateDatabaseService } from '../create-database/create-database.service';
import { RunMigrationService } from '../run-migration/run-migration.service';

@Injectable()
export class RefreshMigrationService {
  constructor(
    private dropDatabaseCommand: DropDatabaseService,
    private createDatabaseCommand: CreateDatabaseService,
    private runMigrationCommand: RunMigrationService,
    private logger: Logger,
  ) {}

  @Command({
    command: 'migration:refresh',
    describe: 'Refresh all migrations',
    autoExit: true,
  })
  public async refreshMigrations(
    @Option({
      name: 'connection',
      describe: 'The connection name',
      default: ConnectionNames.DefaultConnection,
      demandOption: false,
      type: 'string',
    })
    connectionName: ConnectionNames = ConnectionNames.DefaultConnection,
  ) {
    await this.dropDatabaseCommand.dropDatabase(connectionName);
    await this.createDatabaseCommand.createDatabase(connectionName);
    await this.runMigrationCommand.runMigration(connectionName);
  }
}
