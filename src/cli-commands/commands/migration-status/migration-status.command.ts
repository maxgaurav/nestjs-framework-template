import { Command, CommandRunner } from 'nest-commander';
import {
  formatMigrationStatus,
  MigrationStatusService,
} from './migration-status.service.js';

@Command({
  name: 'migration:status',
  description: 'List every migration as up, pending or missing (read-only)',
})
export class MigrationStatusCommand extends CommandRunner {
  constructor(private readonly service: MigrationStatusService) {
    super();
  }

  async run(): Promise<void> {
    const entries = await this.service.status();
    process.stdout.write(`${formatMigrationStatus(entries)}\n`);
  }
}
