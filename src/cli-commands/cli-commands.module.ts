import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
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
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommandModule, AuthModule, CommonModule],
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
  ],
})
export class CliCommandsModule {}
