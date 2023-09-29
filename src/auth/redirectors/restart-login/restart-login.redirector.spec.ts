import { RestartLoginRedirector } from './restart-login.redirector';
import { Test, TestingModule } from '@nestjs/testing';
import { HashEncryptService } from '../../services/hash-encrypt/hash-encrypt.service';
import { UrlBuilderService } from '../../../url-management/services/url-builder/url-builder.service';
import { ConfigService } from '@nestjs/config';

describe('RestartLoginRedirector', () => {
  let redirector: RestartLoginRedirector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestartLoginRedirector,
        HashEncryptService,
        UrlBuilderService,
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compile();

    redirector = await module.resolve(RestartLoginRedirector);
  });

  it('should be defined', () => {
    expect(redirector).toBeDefined();
  });
});
