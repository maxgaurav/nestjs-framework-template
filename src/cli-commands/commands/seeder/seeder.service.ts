import { Injectable, Logger } from '@nestjs/common';
import { Argv, Command, Option } from 'nestjs-command';
import { ModuleRef } from '@nestjs/core';
import { Seeder, SeederConstruct } from '../../seeders/seeder';

interface ToSeedActions {
  all: boolean;
}

const AllowedKeys: (keyof ToSeedActions)[] = ['all'];

const InputSeedersMapping: Record<keyof ToSeedActions, SeederConstruct[]> = {
  all: [],
};

@Injectable()
export class SeederService {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly log: Logger,
  ) {}

  static SeedMaps: SeederConstruct[] = [];

  @Command({
    command: 'seeder:seed',
    describe: 'Seed database',
  })
  public async seed(
    @Option({
      name: 'all',
      type: 'boolean',
      default: false,
      description: 'Seeds everything',
    })
    value: any,
    @Argv()
    argv: ToSeedActions,
  ) {
    this.attachSeedersAsPerInputs(argv);
    for (const seeder of SeederService.SeedMaps) {
      this.log.log(`Seeding for ${seeder.name}`, 'Seeder');
      const seederInstance = this.moduleRef.get<Seeder>(seeder);
      await seederInstance.seed();
      this.log.log(`Seeding completed for ${seeder.name}`, 'Seeder');
    }
  }

  protected attachSeedersAsPerInputs(inputs: ToSeedActions) {
    for (const [key, value] of Object.entries(inputs) as [
      keyof ToSeedActions,
      boolean,
    ][]) {
      if (!AllowedKeys.includes(key)) {
        continue;
      }

      this.log.debug(`The value for input ${key} is ${value}`, 'Seeder');
      if (value) {
        this.log.debug(
          `since value for input ${key} is ${value} hence adding following seeders ${InputSeedersMapping[
            key
          ]
            .map((seeder) => seeder.name)
            .join(',')}`,
          'Seeder',
        );
        SeederService.SeedMaps.push(...InputSeedersMapping[key]);
      }
    }
  }
}
