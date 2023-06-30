import { UserModel } from '../databases/models/user.model';
import { Transaction } from 'sequelize';

declare global {
  namespace Express {
    interface Request {
      user?: UserModel | null;
      scopeTransaction?: Transaction;
    }
  }
}
