import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Transaction } from 'sequelize';
import type { Request } from 'express';

export const ReqTransaction = createParamDecorator(
  (_, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (req.scopeTransaction instanceof Transaction) {
      return req.scopeTransaction;
    }

    return null;
  },
);
