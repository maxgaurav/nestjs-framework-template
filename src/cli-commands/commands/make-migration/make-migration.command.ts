import { Command, CommandRunner } from 'nest-commander';
import { MakeMigrationService } from './make-migration.service.js';

@Command({
  name: 'migration:make',
  arguments: '<name>',
  description: 'Generate a migration stub',
  argsDescription: { name: 'The name of the migration file' },
})
export class MakeMigrationCommand extends CommandRunner {
  constructor(private readonly service: MakeMigrationService) {
    super();
  }

  async run([name]: string[]): Promise<void> {
    await this.service.generateStub(name);
  }
}
