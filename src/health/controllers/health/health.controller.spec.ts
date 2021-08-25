import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import {
  HealthCheckService,
  MemoryHealthIndicator,
  SequelizeHealthIndicator,
  TerminusModule,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { ConnectionNames } from '../../../databases/connection-names';
import { getConnectionToken } from '@nestjs/sequelize';
import { ProcessMessagingService } from '../../../common/services/process-messaging/process-messaging.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      imports: [TerminusModule],
      providers: [
        ConfigService,
        {
          provide: HealthCheckService,
          useValue: {},
        },
        {
          provide: SequelizeHealthIndicator,
          useValue: {},
        },
        {
          provide: MemoryHealthIndicator,
          useValue: {},
        },
        {
          provide: getConnectionToken(ConnectionNames.DefaultConnection),
          useValue: {},
        },
        {
          provide: ProcessMessagingService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
