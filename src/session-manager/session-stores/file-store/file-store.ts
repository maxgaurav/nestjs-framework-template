import { Store } from 'express-session';
import { SessionStoreContract } from '../../interfaces/session-store-contract.interface';
import { Options } from 'session-file-store';
import * as SessionStore from 'session-file-store';

export class FileStore implements SessionStoreContract {
  constructor(
    public session: any,
    public config: Partial<Options> = {},
  ) {}

  store(): Promise<Store> {
    const store = new (SessionStore(this.session))(this.config);
    return Promise.resolve(store);
  }
}
