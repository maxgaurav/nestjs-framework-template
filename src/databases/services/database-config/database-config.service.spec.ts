import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseConfigService } from './database-config.service';
import { ConfigService } from '@nestjs/config';
import { ConnectionNames } from '../../connection-names';

describe('DatabaseConfigService', () => {
  let service: DatabaseConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseConfigService,
        {
          provide: ConfigService,
          useValue: {
            get: (value: any) => ({ passes: value }),
          },
        },
      ],
    }).compile();

    service = module.get<DatabaseConfigService>(DatabaseConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return correct config value', (done) => {
    expect(service.createSequelizeOptions()).toEqual(
      expect.objectContaining({
        passes: `databases.${ConnectionNames.DefaultConnection}`,
      }) as any,
    );

    expect(service.createSequelizeOptions('sample')).toEqual(
      expect.objectContaining({
        passes: `databases.sample`,
      }) as any,
    );

    done();
  });
});
