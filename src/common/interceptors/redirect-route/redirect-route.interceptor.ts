import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { NEVER, Observable, switchMap } from 'rxjs';
import { Request, Response } from 'express';

export type RedirectUrlGenerator<T = any, REQUEST = any | Request> = (
  data: T,
  request: REQUEST,
) => string;

@Injectable()
export class RedirectRouteInterceptor<T = any, REQUEST = any | Request>
  implements NestInterceptor
{
  constructor(protected urlGenerator: RedirectUrlGenerator<T, REQUEST>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      switchMap((content) => {
        context
          .switchToHttp()
          .getResponse<Response>()
          .redirect(
            this.urlGenerator(content, context.switchToHttp().getRequest()),
          );
        return NEVER;
      }),
    );
  }
}
