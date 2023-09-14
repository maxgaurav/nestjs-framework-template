import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as session from 'express-session';
import { RequestHandler } from 'express';
import { SessionConfig } from '../../../environment/interfaces/environment-types.interface';
import { MemoryStore, Store } from 'express-session';
import { FileStore } from '../../session-stores/file-store/file-store';
import { join } from 'path';

@Injectable()
export class SessionConfigService {
  constructor(
    private configService: ConfigService,
    protected logger: Logger,
  ) {}

  public async session(): Promise<RequestHandler> {
    const sessionConfig = this.configService.get<SessionConfig>('session');
    let sessionStore: Store;

    switch (sessionConfig.driver) {
      case 'file':
        sessionStore = await new FileStore(session, {
          path: join(process.cwd(), 'storage', 'session'),
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
        maxAge: 2 * 60 * 60 * 1000,
      },
      saveUninitialized: sessionConfig.saveUninitialized,
    });
  }
}
