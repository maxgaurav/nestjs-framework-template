import {
  CanActivate,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
  ValidationError,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RefreshAccessTokenGuard
  extends AuthGuard('refreshToken')
  implements CanActivate
{
  public handleRequest(
    err: any,
    user: any,
    info: any,
    context: any,
    status?: any,
  ) {
    if (err || !user) {
      const errors: ValidationError[] = [
        {
          property: 'credentials',
          constraints: {
            credentials: 'Credentials are invalid',
          },
          children: [],
        },
      ];
      if (err instanceof UnauthorizedException) {
        throw new UnprocessableEntityException(errors);
      }

      /* istanbul ignore else */
      if (err instanceof UnprocessableEntityException) {
        throw err;
      }
    }
    return super.handleRequest(err, user, info, context, status);
  }
}
