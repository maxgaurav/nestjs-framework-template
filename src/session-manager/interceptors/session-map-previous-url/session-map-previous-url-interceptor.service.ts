import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class SessionMapPreviousUrlInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    // Stateless routes (API, token endpoints) have no session
    if (!request.session) {
      return next.handle();
    }

    const session = request.session;
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
