import { Store } from 'express-session';

export interface SessionStoreContract {
  config: { [key: string]: any };
  session: any;
  store(): Promise<Store>;
}
