import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of, switchMap } from 'rxjs';
import { IntendManagerService } from '../../services/intend-manager/intend-manager.service.js';
import { Request } from 'express';
import { map } from 'rxjs/operators';

@Injectable()
export class SetupIntendInterceptor implements NestInterceptor {
  constructor(private intendManager: IntendManagerService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    return of(true)
      .pipe(
        map(() => {
          // Stateless routes (API, token endpoints) have no session
          if (!request.session) {
            return true;
          }

          this.intendManager.setupIntend(
            context.switchToHttp().getRequest<Request>(),
          );
          return true;
        }),
      )
      .pipe(switchMap(() => next.handle()));
  }
}
