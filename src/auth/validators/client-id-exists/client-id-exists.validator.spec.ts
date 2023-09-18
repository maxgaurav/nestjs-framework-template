import { ClientIdExistsValidator } from './client-id-exists.validator';
import { ClientRepoService } from '../../services/oauth/client-repo/client-repo.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('ClientIdExistsValidator', () => {
  let service: ClientIdExistsValidator;

  const clientRepo: ClientRepoService = {} as ClientRepoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientIdExistsValidator,
        {
          provide: ClientRepoService,
          useValue: clientRepo,
        },
      ],
    }).compile();

    service = await module.resolve<ClientIdExistsValidator>(
      ClientIdExistsValidator,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
