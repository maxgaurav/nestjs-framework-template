import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { from, Observable, switchMap } from 'rxjs';
import { Request, Response } from 'express';
import { HashEncryptService } from '../../services/hash-encrypt/hash-encrypt.service';
import { map } from 'rxjs/operators';
import { AuthorizationDto } from '../../dtos/authorization.dto';

@Injectable()
export class AppendFormActionHeaderInterceptor implements NestInterceptor {
  constructor(protected hashEncrypt: HashEncryptService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();
    const request = context.switchToHttp().getRequest<Request>();

    const contentSecurityHeader =
      response.getHeader('content-security-policy') ?? '';

    return from(
      this.hashEncrypt.decrypt((request.session as any).passwordContent.token),
    )
      .pipe(map((serializedToken) => JSON.parse(serializedToken)))
      .pipe(
        map((authorizationDto: AuthorizationDto) => {
          console.log(authorizationDto);
          response.setHeader(
            'content-security-policy',
            contentSecurityHeader
              .toString()
              .replace(
                `form-action 'self'`,
                `form-action 'self' ${authorizationDto.redirect_url}`,
              ),
          );
          return true;
        }),
      )
      .pipe(switchMap(() => next.handle()));
  }
}
