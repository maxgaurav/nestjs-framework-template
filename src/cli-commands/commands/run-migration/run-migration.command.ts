import { Command, CommandRunner } from 'nest-commander';
import { RunMigrationService } from './run-migration.service.js';

@Command({ name: 'migration:run', description: 'Run all pending migrations' })
export class RunMigrationCommand extends CommandRunner {
  constructor(private readonly service: RunMigrationService) {
    super();
  }

  async run(): Promise<void> {
    await this.service.runMigration();
  }
}
