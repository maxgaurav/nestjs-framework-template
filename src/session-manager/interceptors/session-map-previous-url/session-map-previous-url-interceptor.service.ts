import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { Session } from 'express-session';

@Injectable()
export class SessionMapPreviousUrlInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    if (
      request.url.includes('api/v1') ||
      request.url.includes('oauth/token') ||
      request.url.includes('oauth/refresh')
    ) {
      return next.handle();
    }

    const session: Session & { _previous?: { url: string | null } } =
      request.session;
    session._previous = session._previous || { url: null };
    if (
      request.method.toUpperCase() === 'GET' &&
      request.accepts(['html', 'text', 'json']) !== 'json' &&
      !request.xhr
    ) {
      session._previous.url = request.url;
    }

    return next.handle();
  }
}
