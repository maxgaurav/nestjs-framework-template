import { Command, CommandRunner } from 'nest-commander';
import { RefreshMigrationService } from './refresh-migration.service';

@Command({
  name: 'migration:refresh',
  description: 'Drop all tables and re-run every migration',
})
export class RefreshMigrationCommand extends CommandRunner {
  constructor(private readonly service: RefreshMigrationService) {
    super();
  }

  async run(): Promise<void> {
    await this.service.refreshMigrations();
  }
}
