import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { from, Observable, throwError } from 'rxjs';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../services/auth/auth.service';
import { IncomingHttpHeaders } from 'http2';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AccessTokenGuard extends AuthGuard() implements CanActivate {
  constructor(private readonly authService: AuthService) {
    super();
  }

  canActivate(context: ExecutionContext): Observable<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    return from(
      this.authService.findUserByToken(this.getBearerToken(request.headers)),
    ).pipe(
      map((user) => {
        if (!user) {
          throw new UnauthorizedException();
        }
        request.user = user;
        return true;
      }),
      catchError((err) =>
        throwError(() =>
          err instanceof jwt.JsonWebTokenError
            ? new UnauthorizedException()
            : err,
        ),
      ),
    );
  }

  /**
   * Returns bearer token from the header
   * @param headers
   */
  public getBearerToken(headers: IncomingHttpHeaders): string {
    if (!headers.accept?.toLowerCase().includes('application/json')) {
      throw new NotFoundException();
    }

    if (typeof headers.authorization !== 'string') {
      throw new UnauthorizedException();
    }

    if (!headers.authorization.toLowerCase().includes('bearer ')) {
      throw new UnauthorizedException();
    }

    return headers.authorization.slice(7);
  }
}
