import { Test, TestingModule } from '@nestjs/testing';
import { GenerateClientService } from './generate-client.service';
import { ClientRepoService } from '../../../../auth/services/oauth/client-repo/client-repo.service';
import { Logger } from '@nestjs/common';

describe('GenerateClientService', () => {
  let service: GenerateClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateClientService,
        {
          provide: ClientRepoService,
          useValue: {},
        },
        {
          provide: Logger,
          useValue: console,
        },
      ],
    }).compile();

    service = module.get<GenerateClientService>(GenerateClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
