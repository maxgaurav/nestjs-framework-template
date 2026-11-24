import { Command, CommandRunner, Option } from 'nest-commander';
import { SeederService, ToSeedActions } from './seeder.service.js';

@Command({ name: 'seeder:seed', description: 'Seed the database' })
export class SeederCommand extends CommandRunner {
  constructor(private readonly service: SeederService) {
    super();
  }

  async run(_params: string[], options: Partial<ToSeedActions>): Promise<void> {
    await this.service.seed({ all: options.all ?? false });
  }

  @Option({ flags: '--all', description: 'Seed everything' })
  parseAll(): boolean {
    return true;
  }
}
