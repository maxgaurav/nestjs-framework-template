import { createParamDecorator } from '@nestjs/common';
import { Transaction as SequelizeTransaction } from 'sequelize';

export const ReqTransaction: ParameterDecorator = () => {
  return createParamDecorator((_data, req) => {
    if (req.scopeTransaction instanceof SequelizeTransaction) {
      return req.scopeTransaction;
    }

    throw new Error('Transaction not mapped through interceptor');
  });
};
