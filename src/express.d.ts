import { UserModel } from '../databases/models/user.model';
import { Transaction } from 'sequelize';
import { Session, SessionData } from 'express-session';

declare global {
  namespace Express {
    interface Request {
      user?: UserModel | null;
      scopeTransaction?: Transaction;
    }
  }

  namespace session {
    interface SessionData {
      _previous?: {
        url: string | null;
      };
    }
  }
}
