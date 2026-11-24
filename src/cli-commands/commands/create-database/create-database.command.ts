import { Command, CommandRunner } from 'nest-commander';
import { CreateDatabaseService } from './create-database.service.js';

@Command({ name: 'database:create', description: 'Create the database' })
export class CreateDatabaseCommand extends CommandRunner {
  constructor(private readonly service: CreateDatabaseService) {
    super();
  }

  async run(): Promise<void> {
    await this.service.createDatabase();
  }
}
