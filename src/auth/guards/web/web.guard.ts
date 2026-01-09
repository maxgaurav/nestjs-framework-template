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
import { UserModel } from '../../../databases/models/user.model';

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

    let userId: number | null | boolean;
    try {
      userId = this.getUserFromSession(session);
    } catch (err) {
      return throwError(() => err);
    }

    return this.getUser(request, userId).pipe(
      map((user) => this.mapUserToRequest(request, user)),
    );
  }

  /**
   * Gets the user
   * @param request
   * @param userId
   * @protected
   */
  protected getUser(
    request: Request,
    userId: number | null,
  ): Observable<UserModel | null | boolean> {
    return from(
      userId
        ? this.authService.getLoggedInUser(userId)
        : Promise.reject(new NotFoundException('Record not found')),
    )
      .pipe(notFoundPipe())
      .pipe(
        catchError((err) => {
          if (err instanceof NotFoundException) {
            this.resetSession(request.session);
            return of(false);
          }
          return throwError(() => err);
        }),
      );
  }

  /**
   * Returns user identifier from session if mapped else null
   * @param session
   * @protected
   */
  protected getUserFromSession(
    session: Session & { auth?: { isAuth: boolean; userId: number | null } },
  ): number | null {
    if (!session.auth) {
      session.auth = { isAuth: false, userId: null };
    }

    this.checkAuth(session.auth);

    return session.auth.userId;
  }

  /**
   * Returns true if user is mapped in session auth object
   * @param auth
   * @protected
   */
  protected checkAuth(auth: {
    isAuth: boolean;
    userId: number | null;
  }): boolean {
    if (!auth.isAuth || !auth.userId) {
      throw new UnauthorizedException();
    }
    return true;
  }

  /**
   * Reset session data to remove the authentication state
   * @param session
   * @protected
   */
  protected resetSession(
    session: Session & { auth?: { isAuth: boolean; userId: number | null } },
  ): void {
    session.auth = session.auth || { isAuth: false, userId: null };
    session.auth.isAuth = false;
    session.auth.userId = null;
  }

  /**
   * Map the current logged in user to request
   * @param user
   * @param request
   * @protected
   */
  protected mapUserToRequest(
    request: Request,
    user: UserModel | null | boolean,
  ): boolean {
    if (!!user && typeof user !== 'boolean') {
      request.user = user;
      return true;
    }
    return false;
  }
}
