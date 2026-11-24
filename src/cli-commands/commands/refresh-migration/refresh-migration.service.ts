import { Injectable } from '@nestjs/common';
import { RunMigrationService } from '../run-migration/run-migration.service';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';

@Injectable()
export class RefreshMigrationService {
  constructor(
    private runMigrationCommand: RunMigrationService,
    @InjectConnection() private connection: Sequelize,
  ) {}
  public async refreshMigrations() {
    await this.connection.getQueryInterface().dropAllTables();
    await this.connection.getQueryInterface().dropAllEnums();
    await this.runMigrationCommand.runMigration();
  }
}
