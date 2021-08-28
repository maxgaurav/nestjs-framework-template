import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseConfigService } from './database-config.service';
import { ConfigService } from '@nestjs/config';
import { ConnectionNames } from '../../connection-names';
import { SequelizeModuleOptions } from '@nestjs/sequelize';

describe('DatabaseConfigService', () => {
  let service: DatabaseConfigService;

  const configService = {
    get: (value: any) => ({ passes: value, debug: true }),
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

  it('should return correct config value and setup logger', (done) => {
    const getSpy = jest
      .spyOn(configService, 'get')
      .mockReturnValue({ logging: true } as any);
    const result = service.createSequelizeOptions() as SequelizeModuleOptions;
    expect(typeof result.logging).toEqual('function');

    expect(getSpy).toHaveBeenCalled();
    done();
  });

  it('should trigger log action', () => {
    const loggerFun = service.logger();
    loggerFun('sql', 100);
  });
});
