import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { SESSION_VALIDATION_INPUTS } from '../../constants';
import { map } from 'rxjs/operators';

@Injectable()
export class OldInputsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const flashMessage = request.flash(SESSION_VALIDATION_INPUTS);
    let oldInputs: string | undefined | { [key: string]: any } = {};

    if (flashMessage.length > 0) {
      oldInputs = flashMessage[0];
      oldInputs = JSON.parse(oldInputs) as
        | string
        | undefined
        | { [key: string]: any };
      if (typeof oldInputs !== 'object') {
        oldInputs = {};
      }
    }

    return next.handle().pipe(
      map(
        (
          templateContext:
            | { [key: string]: unknown }
            | undefined
            | null
            | string,
        ) => {
          if (typeof templateContext === 'object' && templateContext !== null) {
            templateContext._oldInputs = oldInputs;
          }

          return templateContext;
        },
      ),
    );
  }
}
