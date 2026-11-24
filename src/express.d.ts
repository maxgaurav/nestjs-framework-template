import type { UserModel } from './databases/models/user.model.js';
import type { Transaction } from 'sequelize';
import type { PasswordDto } from './auth/dtos/password.dto.js';

declare global {
  // oxlint-disable-next-line typescript/no-namespace -- augmenting Express's global namespace
  namespace Express {
    interface Request {
      user?: UserModel | null;
      scopeTransaction?: Transaction;
    }
  }
}

/**
 * Everything the app stores in the session. Augmenting `express-session` (not a global
 * namespace) is what types `req.session.<key>` without casts.
 */
declare module 'express-session' {
  interface SessionData {
    /** Last web GET URL, used to redirect back after a failed form post */
    _previous?: { url: string | null };
    /** Pending email/password login step of the authorization flow */
    passwordContent?: PasswordDto & { passwordId: string };
  }
}
