import { ExtendFunction } from '../extend-function';
import { Injectable, Scope } from '@nestjs/common';
import { TemplateRegister } from '../template-function-registration';
import { CLS_REQ, ClsService } from 'nestjs-cls';
import { Request } from 'express';

@TemplateRegister()
@Injectable({ scope: Scope.TRANSIENT })
export class QueryFunction implements ExtendFunction {
  constructor(protected clsService: ClsService) {}
  functionName(): string {
    return 'query';
  }

  handler(queryKey: string, defaultValue: string): string | string[];
  handler(): { [key: string]: string | string[] };
  handler(
    queryKey?: string,
    defaultValue = '',
  ): string | string[] | { [key: string]: string | string[] } {
    const request = this.clsService.get<Request>(CLS_REQ);
    if (!queryKey) {
      return request.query as { [key: string]: string | string[] };
    }
    return (request.query[queryKey] ?? defaultValue) as string | string[];
  }
}
