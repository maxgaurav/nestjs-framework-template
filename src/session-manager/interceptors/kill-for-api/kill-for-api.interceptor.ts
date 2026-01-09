import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { from, map, Observable, switchMap, throwError } from 'rxjs';
import { Request } from 'express';
import { catchError } from 'rxjs/operators';

@Injectable()
export class KillForApiInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    if (
      request.url.includes('api') ||
      request.url.includes('oauth/token') ||
      request.url.includes('oauth/refresh')
    ) {
      return next.handle().pipe(
        switchMap((result: unknown) =>
          from(
            new Promise<void>((resolve) => {
              request.session.destroy(() => resolve());
            }),
          ).pipe(map(() => result)),
        ),
        catchError((err: unknown) =>
          from(
            new Promise<void>((resolve) => {
              request.session.destroy(() => resolve());
            }),
          ).pipe(switchMap(() => throwError(() => err))),
        ),
      );
    }

    return next.handle();
  }
}
