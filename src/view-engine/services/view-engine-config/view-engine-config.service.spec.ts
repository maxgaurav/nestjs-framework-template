import { Test, TestingModule } from '@nestjs/testing';
import { ViewEngineConfigService } from './view-engine-config.service';
import { TEMPLATE_FUNCTIONS, VIEW_RENDER_ENGINE } from '../../constants';
import { ConfigService } from '@nestjs/config';

describe('ViewEngineConfigService', () => {
  let service: ViewEngineConfigService;

  const configService: ConfigService = {} as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ViewEngineConfigService,
        {
          provide: VIEW_RENDER_ENGINE,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: TEMPLATE_FUNCTIONS,
          useValue: [],
        },
      ],
    }).compile();

    service = module.get<ViewEngineConfigService>(ViewEngineConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
