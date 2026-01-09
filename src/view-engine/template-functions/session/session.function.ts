import { ExtendFunction } from '../extend-function';
import { Injectable, Scope } from '@nestjs/common';
import { TemplateRegister } from '../template-function-registration';
import { CLS_REQ, ClsService } from 'nestjs-cls';
import { Request } from 'express';

@TemplateRegister()
@Injectable({ scope: Scope.TRANSIENT })
export class SessionFunction implements ExtendFunction {
  constructor(protected clsService: ClsService) {}
  functionName(): string {
    return 'session';
  }

  handler<T = unknown>(): T;
  handler<T = unknown>(sessionKey: string, defaultValue: unknown): T;
  handler<T = unknown>(sessionKey?: string, defaultValue = undefined): T {
    const request = this.clsService.get<Request>(CLS_REQ);
    if (!sessionKey) {
      return request.session as never;
    }

    return (
      ((request.session as never as { [key: string]: unknown })[
        sessionKey
      ] as never) ?? defaultValue
    );
  }
}
