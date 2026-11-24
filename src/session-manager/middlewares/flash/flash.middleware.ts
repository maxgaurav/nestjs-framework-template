import type { NextFunction, Request, RequestHandler, Response } from 'express';

type FlashStore = Record<string, string[]>;

declare module 'express-session' {
  interface SessionData {
    flash?: FlashStore;
  }
}

declare global {
  // Augmenting Express's global namespace is the only way to type req.flash
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Read and clear every queued message */
      flash(): FlashStore;
      /** Read and clear the messages queued under `type` */
      flash(type: string): string[];
      /** Queue `message` under `type`; returns how many are queued */
      flash(type: string, message: string | string[]): number;
    }
  }
}

function flash(this: Request): FlashStore;
function flash(this: Request, type: string): string[];
function flash(this: Request, type: string, message: string | string[]): number;
function flash(
  this: Request,
  type?: string,
  message?: string | string[],
): FlashStore | string[] | number {
  if (!this.session) {
    throw new Error('req.flash() requires express-session');
  }

  const store = (this.session.flash ??= {});

  if (type === undefined) {
    this.session.flash = {};
    return store;
  }

  if (message === undefined) {
    const messages = store[type] ?? [];
    delete store[type];
    return messages;
  }

  const queued = (store[type] ??= []);
  queued.push(...(Array.isArray(message) ? message : [message]));
  return queued.length;
}

/**
 * Session flash messages: values set during one request are read (and removed) by a later one.
 * Same `req.flash()` contract as the unmaintained `connect-flash` package it replaces.
 */
export function flashMiddleware(): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction) => {
    request.flash = flash;
    next();
  };
}
