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
      const validationErrors = JSON.parse(errorBag) as ValidationErrorsFormat;
      const allErrors = Object.keys(validationErrors).reduce<string[]>(
        (errors, errorKey) => {
          let errorValuesForKey: string[] = [];

          /* istanbul ignore else */
          if (
            Object.prototype.hasOwnProperty.call(validationErrors, errorKey)
          ) {
            errorValuesForKey = validationErrors[errorKey];
          }

          return errors.concat(errorValuesForKey);
        },
        [],
      );

      errorBag = { all: allErrors, errors: validationErrors };
    }
    return next.handle().pipe(
      map(
        (
          templateContext:
            | {
                [key: string]: unknown;
                _errorBag:
                  | { all: string[]; errors: ValidationErrorsFormat }
                  | undefined
                  | string;
              }
            | undefined
            | null,
        ) => {
          if (typeof templateContext !== 'object' || !templateContext) {
            return templateContext;
          }

          templateContext._errorBag = errorBag;
          return templateContext;
        },
      ),
    );
  }
}
