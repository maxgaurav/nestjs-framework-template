import { SetMetadata } from '@nestjs/common';
import { USE_SESSION } from '../constants.js';

/**
 * Opts a controller under a stateless route (e.g. the versioned API) in to the web session,
 * for cookie-based authentication such as a same-origin SPA. Applied per controller: keep
 * cookie-authenticated endpoints in their own controller.
 *
 * The routes also get a same-origin check for state-changing requests (CSRF). Pair it with a
 * guard that authenticates from the session.
 */
export const UseSession = (): ClassDecorator => SetMetadata(USE_SESSION, true);
