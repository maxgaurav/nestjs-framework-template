import type { Request } from 'express';
import { flashMiddleware } from './flash.middleware.js';

const requestWithSession = (): Request => {
  const request = { session: {} } as unknown as Request;
  flashMiddleware()(request, {} as never, () => undefined);
  return request;
};

describe('flashMiddleware', () => {
  it('queues messages per type and returns the queued count', () => {
    const request = requestWithSession();

    expect(request.flash('info', 'first')).toEqual(1);
    expect(request.flash('info', ['second', 'third'])).toEqual(3);
    expect(request.flash('error', 'oops')).toEqual(1);
  });

  it('returns and clears only the requested type', () => {
    const request = requestWithSession();
    request.flash('info', 'kept until read');
    request.flash('error', 'other type');

    expect(request.flash('info')).toEqual(['kept until read']);
    expect(request.flash('info')).toEqual([]);
    expect(request.flash('error')).toEqual(['other type']);
  });

  it('returns and clears every type when called without arguments', () => {
    const request = requestWithSession();
    request.flash('info', 'a');
    request.flash('error', 'b');

    expect(request.flash()).toEqual({ info: ['a'], error: ['b'] });
    expect(request.flash()).toEqual({});
  });

  it('survives across requests through the session', () => {
    const first = requestWithSession();
    first.flash('info', 'next request');

    const second = { session: first.session } as unknown as Request;
    flashMiddleware()(second, {} as never, () => undefined);

    expect(second.flash('info')).toEqual(['next request']);
  });

  it('fails clearly without express-session', () => {
    const request = {} as Request;
    flashMiddleware()(request, {} as never, () => undefined);

    expect(() => request.flash('info')).toThrow(/express-session/);
  });
});
