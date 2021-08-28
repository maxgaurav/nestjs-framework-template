import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of, switchMap } from 'rxjs';
import { IntendManagerService } from '../../services/intend-manager/intend-manager.service';
import { Request } from 'express';
import { map } from 'rxjs/operators';

@Injectable()
export class SetupIntendInterceptor implements NestInterceptor {
  constructor(private intendManager: IntendManagerService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return of(true)
      .pipe(
        map(() => {
          this.intendManager.setupIntend(
            context.switchToHttp().getRequest<Request>(),
          );
          return true;
        }),
      )
      .pipe(switchMap(() => next.handle()));
  }
}
