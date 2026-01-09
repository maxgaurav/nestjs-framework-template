import { CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { LoggingDecorator } from '../../../common/decorators/logging.decorator';

@Injectable()
export class CheckShowPasswordGuard implements CanActivate {
  @LoggingDecorator({
    messageBefore:
      'Oauth2: verifying if state id in query is correct for stored context',
    messageAfter: 'Oauth2: state id in query is valid',
  })
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const sessionId = request.query.stateId;

    return (
      !!sessionId &&
      (request.session as any).passwordContent?.passwordId === sessionId
    );
  }
}
