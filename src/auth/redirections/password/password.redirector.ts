import { RedirectRouteExecutorInterface } from '../../../interfaces/redirect-route-executor.interface';
import { Injectable, Scope } from '@nestjs/common';
import { UrlBuilderService } from '../../../url-management/services/url-builder/url-builder.service';
import { LoggingDecorator } from '../../../common/decorators/logging.decorator';

@Injectable({ scope: Scope.TRANSIENT })
export class PasswordRedirector implements RedirectRouteExecutorInterface {
  constructor(protected urlBuilder: UrlBuilderService) {}

  @LoggingDecorator({
    messageBefore:
      'Oauth: Generating redirection url to password login screen with state id',
  })
  generateUrl(
    _: any,
    result: { passwordId: string },
  ): Promise<string> | string {
    return this.urlBuilder.url('oauth/authorization/password', {
      queryParameters: { stateId: result.passwordId },
    });
  }
}
