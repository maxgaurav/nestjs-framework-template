import { PasswordRedirector } from './password.redirector.js';
import { Test, TestingModule } from '@nestjs/testing';
import { UrlBuilderService } from '../../../url-management/services/url-builder/url-builder.service.js';
import { ConfigService } from '@nestjs/config';

describe('PasswordRedirector', () => {
  let redirector: PasswordRedirector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordRedirector,
        UrlBuilderService,
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    redirector = await module.resolve(PasswordRedirector);
  });

  it('should be defined', () => {
    expect(redirector).toBeDefined();
  });
});
