import { Injectable, Scope } from '@nestjs/common';
import { RedirectRouteExecutorInterface } from '../../../interfaces/redirect-route-executor.interface';
import { HashEncryptService } from '../../services/hash-encrypt/hash-encrypt.service';
import { UrlBuilderService } from '../../../url-management/services/url-builder/url-builder.service';
import { LoggingDecorator } from '../../../common/decorators/logging.decorator';

@Injectable({ scope: Scope.TRANSIENT })
export class RestartLoginRedirector implements RedirectRouteExecutorInterface {
  constructor(
    protected hashEncrypt: HashEncryptService,
    protected urlBuilder: UrlBuilderService,
  ) {}

  @LoggingDecorator({
    messageBefore:
      'Oauth2: generating redirection url back to login with default state',
  })
  public async generateUrl(
    _: any,
    result: { token: string; email: string },
  ): Promise<string> {
    const authorizationDto = JSON.parse(
      await this.hashEncrypt.decrypt(result.token),
    );

    return this.urlBuilder.url('oauth/authorization', {
      queryParameters: { ...authorizationDto, email: result.email },
    });
  }
}
