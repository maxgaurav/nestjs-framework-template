import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { IntendManagerService } from '../../services/intend-manager/intend-manager.service';

@Catch(UnauthorizedException)
export class RedirectFromLoginFilter implements ExceptionFilter {
  constructor(private intendManager: IntendManagerService) {}

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

    let intendUrl = null;
    if (request.method.toUpperCase() === 'GET') {
      intendUrl = request.url;
    }

    this.intendManager.setUrl(request, intendUrl);

    request.session.save(() => {
      response.redirect(this.loginRoute);
    });
  }
}
