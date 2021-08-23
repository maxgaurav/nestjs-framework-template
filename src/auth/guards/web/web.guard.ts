import {
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { from, Observable, of, throwError } from 'rxjs';
import { Session } from 'express-session';
import { Request } from 'express';
import { AuthService } from '../../services/auth/auth.service';
import { catchError, map } from 'rxjs/operators';
import { notFoundPipe } from '../../../helpers/not-found-pipe';

@Injectable()
export class WebGuard extends AuthGuard('local') {
  constructor(private authService: AuthService) {
    super();
  }

  /**
   * Checks for session authentication
   * @param context
   */
  canActivate(context: ExecutionContext): Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const session: Session & {
      auth?: { isAuth: boolean; userId: number | null };
    } = request.session || ({} as any);

    if (!session.auth) {
      session.auth = { isAuth: false, userId: null };
    }

    if (!session.auth.isAuth || !session.auth.userId) {
      throw new UnauthorizedException();
    }

    return from(this.authService.getLoggedInUser(session.auth.userId))
      .pipe(notFoundPipe())
      .pipe(
        catchError((err) => {
          if (err instanceof NotFoundException) {
            return of(false);
          }
          return throwError(err);
        }),
      )
      .pipe(
        map((user) => {
          if (!!user) {
            request.user = user;
            return true;
          }
          return false;
        }),
      );
  }
}
