import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

interface DefaultValidationError {
  statusCode: number;
  error: string;
  message: ValidationError[];
}

@Catch(UnprocessableEntityException)
export class ErrorValidationFormatFilter implements ExceptionFilter {
  catch(exception: UnprocessableEntityException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const errorResponse: DefaultValidationError =
      exception.getResponse() as any;
    response.status(exception.getStatus()).json({
      errors: this.formattedErrors(errorResponse.message),
      message: errorResponse.error,
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
  ): { [key: string]: string[] } {
    let formattedErrors: { [key: string]: string[] } = {};

    for (const error of errors) {
      formattedErrors[`${propertyPrefix}${error.property}`] = [];
      for (const constraintKey of Object.keys(error.constraints || [])) {
        formattedErrors[`${propertyPrefix}${error.property}`].push(
          error.constraints[constraintKey],
        );
      }

      if ((error?.children?.length || []) > 0) {
        formattedErrors = {
          ...this.formattedErrors(
            error.children,
            `${propertyPrefix}${error.property}.`,
          ),
          ...formattedErrors,
        };
      }
    }

    const finalFormattedErrors: { [key: string]: string[] } = {};
    for (const errorKey of Object.keys(formattedErrors)) {
      if (formattedErrors.hasOwnProperty(errorKey)) {
        if (formattedErrors[errorKey].length > 0) {
          finalFormattedErrors[errorKey] = formattedErrors[errorKey];
        }
      }
    }

    return finalFormattedErrors;
  }
}
