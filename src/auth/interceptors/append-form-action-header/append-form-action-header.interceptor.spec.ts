import { AppendFormActionHeaderInterceptor } from './append-form-action-header.interceptor.js';
import { Test, TestingModule } from '@nestjs/testing';
import { HashEncryptService } from '../../services/hash-encrypt/hash-encrypt.service.js';
import { ConfigService } from '@nestjs/config';

describe('AppendFormActionHeaderInterceptor', () => {
  let interceptor: AppendFormActionHeaderInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        AppendFormActionHeaderInterceptor,
        HashEncryptService,
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compile();

    interceptor = await module.resolve(AppendFormActionHeaderInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });
});
