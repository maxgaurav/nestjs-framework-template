import { Injectable } from '@nestjs/common';
import { ConnectionNames } from '../../../databases/connection-names.js';
import { MigratorFactoryService } from '../../services/migrator-factory/migrator-factory.service.js';

@Injectable()
export class RunMigrationService {
  constructor(private readonly migratorFactory: MigratorFactoryService) {}

  public async runMigration(
    connectionName: ConnectionNames = ConnectionNames.DefaultConnection,
  ) {
    return this.migratorFactory.create(connectionName).up();
  }
}
