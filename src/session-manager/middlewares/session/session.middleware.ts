import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { SessionConfigService } from '../../services/session-config/session-config.service.js';
import { flashMiddleware } from '../flash/flash.middleware.js';

/**
 * express-session + flash, mounted by SessionManagerModule on web routes and on controllers
 * that opt in with @UseSession(). Stateless routes never reach it.
 */
@Injectable()
export class SessionMiddleware implements NestMiddleware {
  private readonly flash = flashMiddleware();
  private sessionHandler?: Promise<RequestHandler>;

  constructor(private readonly sessionConfig: SessionConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Built once, on first use: the store (file store) is created asynchronously
    this.sessionHandler ??= this.sessionConfig.session();
    this.sessionHandler
      .then((handler) =>
        handler(req, res, (error?: unknown) => {
          if (error) {
            next(error);
            return;
          }
          this.flash(req, res, next);
        }),
      )
      .catch(next);
  }
}
