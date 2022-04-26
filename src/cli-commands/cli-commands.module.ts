import { Logger, Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { RouteListService } from './commands/route-list/route-list.service';
import { MakeMigrationService } from './commands/make-migration/make-migration.service';
import { RunMigrationService } from './commands/run-migration/run-migration.service';
import { RollbackMigrationService } from './commands/rollback-migration/rollback-migration.service';
import { RefreshMigrationService } from './commands/refresh-migration/refresh-migration.service';
import { EnvironmentModule } from '../environment/environment.module';
import { ConfigService } from '@nestjs/config';
import { DropDatabaseService } from './commands/drop-database/drop-database.service';
import { CreateDatabaseService } from './commands/create-database/create-database.service';
import { GenerateOauthKeysService } from './commands/oauth/generate-private-keys/generate-oauth-keys.service';
import { GenerateClientService } from './commands/oauth/generate-client/generate-client.service';
import { ClientRepoService } from '../auth/services/oauth/client-repo/client-repo.service';
import { SeederService } from './commands/seeder/seeder.service';
import { DatabasesModule } from '../databases/databases.module';
import { LoggingService } from '../services/logging/logging.service';

@Module({
  imports: [CommandModule, EnvironmentModule, DatabasesModule],
  providers: [
    RouteListService,
    Logger,
    LoggingService,
    MakeMigrationService,
    RunMigrationService,
    RollbackMigrationService,
    RefreshMigrationService,
    ConfigService,
    DropDatabaseService,
    CreateDatabaseService,
    GenerateOauthKeysService,
    GenerateClientService,
    ClientRepoService,
    SeederService,
  ],
})
export class CliCommandsModule {}
