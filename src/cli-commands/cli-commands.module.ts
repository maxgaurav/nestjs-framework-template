import { Logger, Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { RouteListService } from './commands/route-list/route-list.service';
import { MakeMigrationService } from './commands/make-migration/make-migration.service';
import { RunMigrationService } from './commands/run-migration/run-migration.service';
import { RollbackMigrationService } from './commands/rollback-migration/rollback-migration.service';
import { RefreshMigrationService } from './commands/refresh-migration/refresh-migration.service';
import { EnvironmentModule } from '../environment/environment.module';
import { ConfigService } from '@nestjs/config';
import { DatabaseHelperService } from './services/database-helper/database-helper.service';
import { DropDatabaseService } from './commands/drop-database/drop-database.service';
import { CreateDatabaseService } from './commands/create-database/create-database.service';

@Module({
  imports: [CommandModule, EnvironmentModule],
  providers: [
    RouteListService,
    Logger,
    MakeMigrationService,
    RunMigrationService,
    RollbackMigrationService,
    RefreshMigrationService,
    ConfigService,
    DatabaseHelperService,
    DropDatabaseService,
    CreateDatabaseService,
  ],
})
export class CliCommandsModule {}
