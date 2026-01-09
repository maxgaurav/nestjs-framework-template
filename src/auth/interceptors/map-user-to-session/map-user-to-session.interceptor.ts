import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { from, Observable, switchMap } from 'rxjs';
import { AuthorizationChallengeModel } from '../../../databases/models/oauth/authorization-challenge.model';
import { Request } from 'express';
import { AuthService } from '../../services/auth/auth.service';
import { map } from 'rxjs/operators';
import { UserModel } from '../../../databases/models/user.model';

@Injectable()
export class MapUserToSessionInterceptor implements NestInterceptor {
  constructor(protected auth: AuthService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      switchMap((result: AuthorizationChallengeModel) =>
        from(result.$get('user') as Promise<UserModel>)
          .pipe(
            switchMap((user) =>
              this.auth.mapSessionWithUser(
                context.switchToHttp().getRequest<Request>().session,
                user,
              ),
            ),
          )
          .pipe(map(() => result)),
      ),
    );
  }
}
