import { Module } from '@nestjs/common';
import { RouteListService } from './commands/route-list/route-list.service.js';
import { MakeMigrationService } from './commands/make-migration/make-migration.service.js';
import { RunMigrationService } from './commands/run-migration/run-migration.service.js';
import { RollbackMigrationService } from './commands/rollback-migration/rollback-migration.service.js';
import { RefreshMigrationService } from './commands/refresh-migration/refresh-migration.service.js';
import { DropDatabaseService } from './commands/drop-database/drop-database.service.js';
import { CreateDatabaseService } from './commands/create-database/create-database.service.js';
import { GenerateOauthKeysService } from './commands/oauth/generate-private-keys/generate-oauth-keys.service.js';
import { GenerateClientService } from './commands/oauth/generate-client/generate-client.service.js';
import { SeederService } from './commands/seeder/seeder.service.js';
import { RouteListCommand } from './commands/route-list/route-list.command.js';
import { MakeMigrationCommand } from './commands/make-migration/make-migration.command.js';
import { RunMigrationCommand } from './commands/run-migration/run-migration.command.js';
import { RollbackMigrationCommand } from './commands/rollback-migration/rollback-migration.command.js';
import { RefreshMigrationCommand } from './commands/refresh-migration/refresh-migration.command.js';
import { DropDatabaseCommand } from './commands/drop-database/drop-database.command.js';
import { CreateDatabaseCommand } from './commands/create-database/create-database.command.js';
import { GenerateOauthKeysCommand } from './commands/oauth/generate-private-keys/generate-oauth-keys.command.js';
import { GenerateClientCommand } from './commands/oauth/generate-client/generate-client.command.js';
import { SeederCommand } from './commands/seeder/seeder.command.js';
import { MigratorFactoryService } from './services/migrator-factory/migrator-factory.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { CommonModule } from '../common/common.module.js';

@Module({
  imports: [AuthModule, CommonModule],
  providers: [
    MigratorFactoryService,
    RouteListService,
    MakeMigrationService,
    RunMigrationService,
    RollbackMigrationService,
    RefreshMigrationService,
    DropDatabaseService,
    CreateDatabaseService,
    GenerateOauthKeysService,
    GenerateClientService,
    SeederService,
    RouteListCommand,
    MakeMigrationCommand,
    RunMigrationCommand,
    RollbackMigrationCommand,
    RefreshMigrationCommand,
    DropDatabaseCommand,
    CreateDatabaseCommand,
    GenerateOauthKeysCommand,
    GenerateClientCommand,
    SeederCommand,
  ],
})
export class CliCommandsModule {}
