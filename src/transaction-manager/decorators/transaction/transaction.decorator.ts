import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Transaction as SequelizeTransaction } from 'sequelize';

export const ReqTransaction = createParamDecorator(
  (_data, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    if (req.scopeTransaction instanceof SequelizeTransaction) {
      return req.scopeTransaction;
    }

    return null;
  },
);
