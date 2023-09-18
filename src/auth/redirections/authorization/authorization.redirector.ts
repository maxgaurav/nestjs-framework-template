import { Injectable, Scope } from '@nestjs/common';
import { RedirectRouteExecutorInterface } from '../../../interfaces/redirect-route-executor.interface';
import { AuthorizationChallengeModel } from '../../../databases/models/oauth/authorization-challenge.model';
import { AuthService } from '../../services/auth/auth.service';
import { Request } from 'express';

@Injectable({ scope: Scope.TRANSIENT })
export class AuthorizationRedirector implements RedirectRouteExecutorInterface {
  constructor(public authService: AuthService) {}

  /**
   * Generates redirect url for redirection back to the main app
   * @param request
   * @param response
   */
  generateUrl(
    request: Request,
    response: AuthorizationChallengeModel,
  ): Promise<string> | string {
    const url = new URL(request.body.token.redirect_url);
    url.searchParams.append('code', response.id);
    url.searchParams.append('state', request.query.state?.toString() || '');

    return url.toString();
  }
}
