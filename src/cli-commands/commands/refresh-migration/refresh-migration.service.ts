import { Injectable } from '@nestjs/common';
import { Command } from 'nestjs-command';
import { RunMigrationService } from '../run-migration/run-migration.service';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';

@Injectable()
export class RefreshMigrationService {
  constructor(
    private runMigrationCommand: RunMigrationService,
    @InjectConnection() private connection: Sequelize,
  ) {}

  @Command({
    command: 'migration:refresh',
    describe: 'Refresh all migrations',
  })
  public async refreshMigrations() {
    await this.connection.getQueryInterface().dropAllTables();
    await this.connection.getQueryInterface().dropAllEnums();
    await this.runMigrationCommand.runMigration();
  }
}
