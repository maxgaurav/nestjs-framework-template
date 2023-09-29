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

  handler<T = any>(): T;
  handler<T = any>(sessionKey: string, defaultValue: string): T;
  handler<T = any>(sessionKey?: string, defaultValue = undefined): T {
    const request = this.clsService.get(CLS_REQ) as Request;
    if (!sessionKey) {
      return request.session as any;
    }

    return request.session[sessionKey] ?? defaultValue;
  }
}
