import {
  Injectable,
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
    console.log('handle');
    if (err || !user) {
      const errors: ValidationError[] = [
        {
          property: 'email',
          constraints: {
            credentials: 'Credentials are invalid',
          },
          children: [],
        },
      ];
      if (err instanceof UnprocessableEntityException || !user) {
        throw new UnprocessableEntityException(errors);
      }
    }
    return super.handleRequest(err, user, info, context, status);
  }
}
