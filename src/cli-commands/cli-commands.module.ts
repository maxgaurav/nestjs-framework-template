import { Module } from '@nestjs/common';
import { RouteListService } from './commands/route-list/route-list.service';
import { MakeMigrationService } from './commands/make-migration/make-migration.service';
import { RunMigrationService } from './commands/run-migration/run-migration.service';
import { RollbackMigrationService } from './commands/rollback-migration/rollback-migration.service';
import { RefreshMigrationService } from './commands/refresh-migration/refresh-migration.service';
import { DropDatabaseService } from './commands/drop-database/drop-database.service';
import { CreateDatabaseService } from './commands/create-database/create-database.service';
import { GenerateOauthKeysService } from './commands/oauth/generate-private-keys/generate-oauth-keys.service';
import { GenerateClientService } from './commands/oauth/generate-client/generate-client.service';
import { SeederService } from './commands/seeder/seeder.service';
import { RouteListCommand } from './commands/route-list/route-list.command';
import { MakeMigrationCommand } from './commands/make-migration/make-migration.command';
import { RunMigrationCommand } from './commands/run-migration/run-migration.command';
import { RollbackMigrationCommand } from './commands/rollback-migration/rollback-migration.command';
import { RefreshMigrationCommand } from './commands/refresh-migration/refresh-migration.command';
import { DropDatabaseCommand } from './commands/drop-database/drop-database.command';
import { CreateDatabaseCommand } from './commands/create-database/create-database.command';
import { GenerateOauthKeysCommand } from './commands/oauth/generate-private-keys/generate-oauth-keys.command';
import { GenerateClientCommand } from './commands/oauth/generate-client/generate-client.command';
import { SeederCommand } from './commands/seeder/seeder.command';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [AuthModule, CommonModule],
  providers: [
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
