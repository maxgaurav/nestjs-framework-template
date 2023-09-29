import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { from, Observable, switchMap } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class ClearAuthorizationTrackingStatesInterceptor
  implements NestInterceptor
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    (request.session as any).passwordContent = undefined;

    return next
      .handle()
      .pipe(
        switchMap((result) =>
          from(
            new Promise((res, rej) =>
              request.session.save((err) => (!!err ? rej(err) : res(result))),
            ),
          ),
        ),
      );
  }
}
