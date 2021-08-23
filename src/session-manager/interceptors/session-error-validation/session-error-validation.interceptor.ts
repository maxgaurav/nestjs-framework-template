import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { SESSION_VALIDATION_ERROR_KEY } from '../../constants';
import { ValidationErrorsFormat } from '../../../interfaces/validation-errors-format';

@Injectable()
export class SessionErrorValidationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const flashMessage = request.flash(SESSION_VALIDATION_ERROR_KEY);
    let errorBag:
      | string
      | undefined
      | { errors: ValidationErrorsFormat; all: string[] } = {
      all: [],
      errors: {},
    };

    if (flashMessage.length > 0) {
      errorBag = flashMessage[0];
      const validationErrors: ValidationErrorsFormat = JSON.parse(errorBag);
      const allErrors = Object.keys(validationErrors).reduce(
        (errors, errorKey) => {
          let errorValuesForKey = [];

          if (validationErrors.hasOwnProperty(errorKey)) {
            errorValuesForKey = validationErrors[errorKey];
          }

          return errors.concat(errorValuesForKey);
        },
        [],
      );

      errorBag = { all: allErrors, errors: validationErrors };
    }
    return next.handle().pipe(
      map((templateContext: { [key: string]: any } | undefined | null) => {
        if (typeof templateContext !== 'object') {
          return templateContext;
        }

        templateContext._errorBag = errorBag;
        return templateContext;
      }),
    );
  }
}
