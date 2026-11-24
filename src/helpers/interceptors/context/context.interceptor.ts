import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { UserModel } from '../../../databases/models/user.model.js';
import { randomUUID } from 'node:crypto';

@Injectable()
export class ContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.method.toUpperCase() === 'GET') {
      return next.handle();
    }

    // Express 5 leaves req.body undefined when no body was sent
    request.body ??= {};
    (request.body as { __CONTEXT: unknown }).__CONTEXT = {
      params: request.params,
      query: request.query,
      user: request.user ? (request.user as UserModel).id : null,
      id: randomUUID(),
    };

    return next.handle();
  }
}
