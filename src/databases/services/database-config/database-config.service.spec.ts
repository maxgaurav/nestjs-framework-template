import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseConfigService } from './database-config.service.js';
import { ConfigService } from '@nestjs/config';
import { ConnectionNames } from '../../connection-names.js';
import { SequelizeModuleOptions } from '@nestjs/sequelize';

describe('DatabaseConfigService', () => {
  let service: DatabaseConfigService;

  const configService = {
    getOrThrow: (value: any) => ({ passes: value, debug: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseConfigService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<DatabaseConfigService>(DatabaseConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return correct config value', () => {
    expect(service.createSequelizeOptions()).toEqual(
      expect.objectContaining({
        passes: `databases.${ConnectionNames.DefaultConnection}`,
      }),
    );

    expect(service.createSequelizeOptions('sample')).toEqual(
      expect.objectContaining({
        passes: `databases.sample`,
      }),
    );
  });

  it('should return correct config value and setup logger', () => {
    const getSpy = vi
      .spyOn(configService, 'getOrThrow')
      .mockReturnValue({ logging: true } as any);
    const result = service.createSequelizeOptions() as SequelizeModuleOptions;
    expect(typeof result.logging).toEqual('function');

    expect(getSpy).toHaveBeenCalled();
  });

  it('should trigger log action', () => {
    const loggerFun = service.logger();
    loggerFun('sql', 100);
  });
});
