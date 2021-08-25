import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(UnauthorizedException)
export class RedirectToLoginFilter implements ExceptionFilter {
  protected loginRoute = '/';

  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();

    if (request.xhr || request.accepts(['html', 'text', 'json']) === 'json') {
      response.status(HttpStatus.UNAUTHORIZED).json({
        errors: { error: [exception.message] },
        message: exception.message,
      });
      return;
    }

    response.redirect(this.loginRoute);
  }
}
