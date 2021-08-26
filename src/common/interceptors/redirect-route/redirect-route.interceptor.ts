import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { from, NEVER, Observable, switchMap } from 'rxjs';
import { Request, Response } from 'express';

export type RedirectUrlGenerator<T = any> = (
  data: T,
  request: Request,
) => string;

@Injectable()
export class RedirectRouteInterceptor<T = any> implements NestInterceptor {
  constructor(protected urlGenerator: RedirectUrlGenerator<T>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    return next.handle().pipe(
      switchMap((content) =>
        from(this.saveSession(request)).pipe(
          switchMap(() => {
            context
              .switchToHttp()
              .getResponse<Response>()
              .redirect(this.urlGenerator(content, request));
            return NEVER;
          }),
        ),
      ),
    );
  }

  /**
   * Saves the session state
   * @param request
   */
  public saveSession(request: Request): Promise<boolean> {
    return new Promise<boolean>((res, rej) => {
      request.session.save((err) => {
        if (!!err) {
          rej(err);
          return;
        }
        res(true);
      });
    });
  }
}
