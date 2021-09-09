import { Test, TestingModule } from '@nestjs/testing';
import { SeederService } from './seeder.service';
import { ModuleRef } from '@nestjs/core';
import { Logger } from '@nestjs/common';

describe('SeederService', () => {
  let service: SeederService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeederService,
        {
          provide: ModuleRef,
          useValue: {},
        },
        {
          provide: Logger,
          useValue: console,
        },
      ],
    }).compile();

    service = module.get<SeederService>(SeederService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
