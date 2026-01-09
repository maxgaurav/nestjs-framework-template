import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';
import {
  SESSION_VALIDATION_ERROR_KEY,
  SESSION_VALIDATION_INPUTS,
} from '../../../session-manager/constants';
import { ValidationErrorsFormat } from '../../../interfaces/validation-errors-format';

interface DefaultValidationError {
  statusCode: number;
  error: string;
  message: ValidationError[];
}

@Catch(UnprocessableEntityException)
export class ErrorValidationFormatFilter implements ExceptionFilter {
  catch(exception: UnprocessableEntityException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const errorResponse: DefaultValidationError =
      exception.getResponse() as DefaultValidationError;

    const errors = this.formattedErrors(errorResponse.message);

    if (request.accepts(['html', 'text', 'json']) === 'json') {
      response.status(exception.getStatus()).json({
        errors,
        message: errorResponse.error,
      });
      return;
    }
    request.flash(SESSION_VALIDATION_ERROR_KEY);
    request.flash(SESSION_VALIDATION_INPUTS);
    request.flash(SESSION_VALIDATION_ERROR_KEY, JSON.stringify(errors));
    request.flash(SESSION_VALIDATION_INPUTS, JSON.stringify(request.body));
    const sessionPreviousUrl =
      (request.session as never as { _previous?: { url?: string } })._previous
        ?.url || '/';
    const previousUrl = request.header('referrer') || sessionPreviousUrl;
    request.session.save(() => {
      response.redirect(previousUrl);
    });
  }

  /**
   * Returns errors formatted to specification
   * @param errors
   * @param propertyPrefix
   */
  public formattedErrors(
    errors: ValidationError[],
    propertyPrefix = '',
  ): ValidationErrorsFormat {
    let formattedErrors: ValidationErrorsFormat = {};

    for (const error of errors) {
      formattedErrors[`${propertyPrefix}${error.property}`] = [];
      for (const constraintKey of Object.keys(error.constraints || [])) {
        formattedErrors[`${propertyPrefix}${error.property}`].push(
          (error.constraints as never as { [key: string]: unknown })[
            constraintKey
          ] as never,
        );
      }

      if ((error?.children || []).length > 0) {
        formattedErrors = {
          ...this.formattedErrors(
            error.children as never,
            `${propertyPrefix}${error.property}.`,
          ),
          ...formattedErrors,
        };
      }
    }

    const finalFormattedErrors: { [key: string]: string[] } = {};
    for (const errorKey of Object.keys(formattedErrors)) {
      if (!Object.prototype.hasOwnProperty.call(formattedErrors, errorKey)) {
        continue;
      }

      if (formattedErrors[errorKey].length > 0) {
        finalFormattedErrors[errorKey] = formattedErrors[errorKey];
      }
    }

    return finalFormattedErrors;
  }
}
