import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { NEVER, Observable, of, switchMap, throwError } from 'rxjs';
import { Response } from 'express';
import { WebGuard } from '../../guards/web/web.guard';
import { catchError } from 'rxjs/operators';

@Injectable()
export class RedirectIfAuthenticatedInterceptor implements NestInterceptor {
  /**
   * Default redirect url
   * @protected
   */
  protected defaultRedirectUrl = '/dashboard';

  constructor(private webGuard: WebGuard) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();
    return this.webGuard
      .canActivate(context)
      .pipe(
        catchError((err) => {
          if (err instanceof UnauthorizedException) {
            return of(false);
          }
          return throwError(err);
        }),
      )
      .pipe(
        switchMap((result) => {
          if (result) {
            response.redirect(this.getRedirectUrl());
            return NEVER;
          }

          return next.handle();
        }),
      );
  }

  /**
   * The redirect url when system is in auth state
   */
  public getRedirectUrl(): string {
    return this.defaultRedirectUrl;
  }
}
