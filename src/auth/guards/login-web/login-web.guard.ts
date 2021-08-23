import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
  ValidationError,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LoginWebGuard extends AuthGuard('local') {
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
      if (err instanceof UnauthorizedException || !user) {
        throw new UnprocessableEntityException(errors);
      }
    }
    return super.handleRequest(err, user, info, context, status);
  }
}
