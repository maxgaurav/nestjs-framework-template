import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ValidationError } from 'class-validator';
import { ErrorValidationFormatFilter } from '../../../helpers/filters/error-validation-format/error-validation-format.filter.js';

/**
 * An invalid authorization request (unknown client, bad redirect url, missing grant data) has no
 * form to go back to, and redirecting would bounce the browser between the client app and this
 * route. Per RFC 6749 §4.1.2.1 the error is shown to the user instead of redirecting to an
 * unverified client. JSON clients keep the standard 422 format.
 */
@Catch(UnprocessableEntityException)
export class AuthorizationRequestErrorFilter implements ExceptionFilter {
  private readonly validationFormat = new ErrorValidationFormatFilter();

  catch(exception: UnprocessableEntityException, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest<Request>();
    const response = host.switchToHttp().getResponse<Response>();

    if (request.accepts(['html', 'text', 'json']) === 'json') {
      this.validationFormat.catch(exception, host);
      return;
    }

    const errors = this.validationFormat.formattedErrors(
      (exception.getResponse() as { message: ValidationError[] }).message,
    );
    response
      .status(HttpStatus.BAD_REQUEST)
      .render('authorization/invalid-request', {
        errors: Object.values(errors).flat(),
      });
  }
}
