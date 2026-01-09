import { CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { LoggingDecorator } from '../../../common/decorators/logging.decorator';

@Injectable()
export class CanRestartLoginGuard implements CanActivate {
  @LoggingDecorator({
    messageBefore:
      'Oauth2: Verifying password state content exists to allow restart flow of login',
  })
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const session: any = request.session;

    return !!session.passwordContent?.email && !!session.passwordContent?.token;
  }
}
