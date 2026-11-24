import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { SessionConfigService } from '../../services/session-config/session-config.service.js';
import { flashMiddleware } from '../flash/flash.middleware.js';

/**
 * express-session + flash, mounted by SessionManagerModule on web routes and on controllers
 * that opt in with @UseSession(). Stateless routes never reach it.
 */
@Injectable()
export class SessionMiddleware implements NestMiddleware {
  private readonly flash = flashMiddleware();

  constructor(private readonly sessionConfig: SessionConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // One shared handler (and store) for the whole app, created on first use
    this.sessionConfig
      .session()
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
