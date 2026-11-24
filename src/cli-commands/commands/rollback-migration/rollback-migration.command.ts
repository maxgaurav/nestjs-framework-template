import { Command, CommandRunner, Option } from 'nest-commander';
import { RollbackMigrationService } from './rollback-migration.service.js';
import { ConnectionNames } from '../../../databases/connection-names.js';

interface RollbackMigrationOptions {
  till?: number;
}

@Command({
  name: 'migration:rollback',
  description:
    'Roll back the last migration, or the number of migrations given by --till',
})
export class RollbackMigrationCommand extends CommandRunner {
  constructor(private readonly service: RollbackMigrationService) {
    super();
  }

  async run(
    _params: string[],
    options: RollbackMigrationOptions,
  ): Promise<void> {
    await this.service.rollbackMigration(
      ConnectionNames.DefaultConnection,
      options.till,
    );
  }

  @Option({
    flags: '--till <count>',
    description: 'Number of migrations to roll back',
  })
  parseTill(value: string): number {
    const count = Number(value);
    if (!Number.isInteger(count) || count < 1) {
      throw new Error(`--till must be a positive integer, got "${value}"`);
    }
    return count;
  }
}
