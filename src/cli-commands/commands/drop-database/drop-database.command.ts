import { Command, CommandRunner } from 'nest-commander';
import { DropDatabaseService } from './drop-database.service.js';

@Command({ name: 'database:drop', description: 'Drop the database' })
export class DropDatabaseCommand extends CommandRunner {
  constructor(private readonly service: DropDatabaseService) {
    super();
  }

  async run(): Promise<void> {
    await this.service.dropDatabase();
  }
}
