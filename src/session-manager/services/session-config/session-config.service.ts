import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import session from 'express-session';
import { RequestHandler } from 'express';
import { SessionConfig } from '../../../environment/environment-types.interface.js';
import { MemoryStore, Store } from 'express-session';
import { FileStore } from '../../session-stores/file-store/file-store.js';
import { join } from 'node:path';
import { cwd } from 'node:process';

@Injectable()
export class SessionConfigService {
  constructor(
    private configService: ConfigService,
    protected logger: Logger,
  ) {}

  private handler?: Promise<RequestHandler>;

  /**
   * The app's one session handler. Memoised so every route that mounts the session (web routes
   * and @UseSession controllers) shares the same store: two MemoryStores would mean a session
   * started on a web page is invisible to a cookie-authenticated API route.
   */
  public session(): Promise<RequestHandler> {
    this.handler ??= this.createSession();
    return this.handler;
  }

  protected async createSession(): Promise<RequestHandler> {
    const sessionConfig =
      this.configService.getOrThrow<SessionConfig>('session');
    let sessionStore: Store;

    switch (sessionConfig.driver) {
      case 'file':
        sessionStore = await new FileStore(session, {
          path: join(cwd(), 'storage', 'session'),
          logFn: (...args) =>
            args.forEach((arg) => this.logger.debug(arg, 'session-file-store')),
        }).store();
        break;
      case 'memory':
      default:
        sessionStore = new MemoryStore();
    }

    return session({
      store: sessionStore,
      secret: sessionConfig.secret,
      name: sessionConfig.name,
      resave: sessionConfig.resave,
      cookie: {
        secure: sessionConfig.secureCookie,
        httpOnly: true,
        // Not sent on cross-site subrequests and POSTs: first line of CSRF defence
        sameSite: 'lax',
        maxAge: 2 * 60 * 60 * 1000,
      },
      saveUninitialized: sessionConfig.saveUninitialized,
    });
  }
}
