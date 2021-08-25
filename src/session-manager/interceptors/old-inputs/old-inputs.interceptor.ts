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
      oldInputs = JSON.parse(oldInputs);
      if (typeof oldInputs !== 'object') {
        oldInputs = {};
      }
    }

    return next.handle().pipe(
      map(
        (templateContext: { [key: string]: any } | undefined | null | any) => {
          if (typeof templateContext !== 'object') {
            return templateContext;
          }

          if (templateContext === undefined || templateContext === null) {
            return templateContext;
          }

          templateContext._oldInputs = oldInputs;
          return templateContext;
        },
      ),
    );
  }
}
