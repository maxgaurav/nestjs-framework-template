import { Injectable, Scope } from '@nestjs/common';
import { RedirectRouteExecutorInterface } from '../../../interfaces/redirect-route-executor.interface.js';
import { AuthorizationChallengeModel } from '../../../databases/models/oauth/authorization-challenge.model.js';
import { Request } from 'express';

@Injectable({ scope: Scope.TRANSIENT })
export class AuthorizationRedirector implements RedirectRouteExecutorInterface {
  constructor() {}

  /**
   * Generates redirect url for redirection back to the main app
   * @param request
   * @param response
   */
  generateUrl(
    request: Request,
    response: AuthorizationChallengeModel,
  ): Promise<string> | string {
    // The original authorization request travels (encrypted) in the form token
    const authorization = (
      request.body as { token: { redirect_url: string; state?: unknown } }
    ).token;
    const url = new URL(authorization.redirect_url);
    url.searchParams.append('code', response.id);
    // Return the client's opaque state unchanged (RFC 6749 §4.1.2); it was read from the POST's
    // query string before and always came back empty
    url.searchParams.append(
      'state',
      typeof authorization.state === 'string' ? authorization.state : '',
    );

    return url.toString();
  }
}
