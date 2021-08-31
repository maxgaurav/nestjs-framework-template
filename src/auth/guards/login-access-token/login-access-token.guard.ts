import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
  ValidationError,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LoginAccessTokenGuard
  extends AuthGuard('accessToken')
  implements CanActivate
{
  /**
   * Handle main request
   * @param err
   * @param user
   * @param info
   * @param context
   * @param status
   */
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

      if (err instanceof UnprocessableEntityException) {
        throw err;
      }
    }
    return super.handleRequest(err, user, info, context, status);
  }
}
