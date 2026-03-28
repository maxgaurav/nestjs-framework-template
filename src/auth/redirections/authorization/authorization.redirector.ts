import { Injectable, Scope } from '@nestjs/common';
import { RedirectRouteExecutorInterface } from '../../../interfaces/redirect-route-executor.interface';
import { AuthorizationChallengeModel } from '../../../databases/models/oauth/authorization-challenge.model';
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
    const url = new URL(
      (request.body as never as { token: { redirect_url: string } }).token
        .redirect_url,
    );
    url.searchParams.append('code', response.id);
    url.searchParams.append(
      'state',
      (request.query as never as { state?: string }).state?.toString() || '',
    );

    return url.toString();
  }
}
