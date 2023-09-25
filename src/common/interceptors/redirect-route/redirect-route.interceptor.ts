import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { from, Observable, of, switchMap } from 'rxjs';
import { Request, Response } from 'express';
import { ModuleRef, Reflector } from '@nestjs/core';
import { RedirectRouteExecutorInterface } from '../../../interfaces/redirect-route-executor.interface';
import { RedirectGenerator } from '../../decorators/redirect-generator.decorator';
import { map } from 'rxjs/operators';

@Injectable()
export class RedirectRouteInterceptor implements NestInterceptor {
  constructor(
    private moduleRef: ModuleRef,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    return next.handle().pipe(
      switchMap((content) =>
        from(this.saveSession(request)).pipe(
          switchMap(() =>
            from(
              this.moduleRef.resolve<RedirectRouteExecutorInterface>(
                this.reflector.getAllAndOverride(RedirectGenerator, [
                  context.getHandler(),
                  context.getClass(),
                ]),
              ),
            ).pipe(
              switchMap((redirectHandler) => {
                const result = redirectHandler.generateUrl(request, content);
                if (result instanceof Promise) {
                  return from(result);
                }

                return of(result);
              }),
              map((url) => {
                context.switchToHttp().getResponse<Response>().redirect(url);
                return undefined;
              }),
            ),
          ),
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
