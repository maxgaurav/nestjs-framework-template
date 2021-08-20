import { Test, TestingModule } from '@nestjs/testing';
import { SetupClusterService } from './setup-cluster.service';
import { ConfigService } from '@nestjs/config';
import { ProcessMessagingService } from '../../../common/services/process-messaging/process-messaging.service';

describe('SetupClusterService', () => {
  let service: SetupClusterService;

  const processMessaging = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SetupClusterService,
        ConfigService,
        {
          provide: ProcessMessagingService,
          useValue: processMessaging,
        },
      ],
    }).compile();

    service = module.get<SetupClusterService>(SetupClusterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
