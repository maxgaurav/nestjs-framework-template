import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { UserModel } from '../../../databases/models/user.model';
import * as uuid from 'uuid';

@Injectable()
export class ContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    request.body.__CONTEXT = {
      params: request.params,
      query: request.query,
      user: !!request.user ? (request.user as UserModel).id : null,
      id: uuid.v4().toString(),
    };

    return next.handle();
  }
}
