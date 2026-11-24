import { Injectable } from '@nestjs/common';
import { ConnectionNames } from '../../../databases/connection-names.js';
import { MigratorFactoryService } from '../../services/migrator-factory/migrator-factory.service.js';

@Injectable()
export class RollbackMigrationService {
  constructor(private readonly migratorFactory: MigratorFactoryService) {}

  /**
   * Rolls back the last migration, or the last `till` migrations
   */
  public async rollbackMigration(
    connectionName: ConnectionNames = ConnectionNames.DefaultConnection,
    till = 1,
  ) {
    return this.migratorFactory.create(connectionName).down({ step: till });
  }
}
