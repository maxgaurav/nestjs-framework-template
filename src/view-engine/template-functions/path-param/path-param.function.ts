import { ExtendFunction } from '../extend-function';
import { Injectable, Scope } from '@nestjs/common';
import { TemplateRegister } from '../template-function-registration';
import { CLS_REQ, ClsService } from 'nestjs-cls';
import { Request } from 'express';

@TemplateRegister()
@Injectable({ scope: Scope.TRANSIENT })
export class PathParamFunction implements ExtendFunction {
  constructor(protected clsService: ClsService) {}
  functionName(): string {
    return 'pathParam';
  }

  handler(paramKey: string, defaultValue: string): string;
  handler(): { [key: string]: string };
  handler(
    paramKey?: string,
    defaultValue = '',
  ): string | { [key: string]: string } {
    const request = this.clsService.get<Request>(CLS_REQ);
    if (!paramKey) {
      return request.params;
    }

    return request.params[paramKey] ?? defaultValue;
  }
}
