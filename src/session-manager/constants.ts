export const SESSION_VALIDATION_ERROR_KEY = 'validationErrors';
export const SESSION_VALIDATION_INPUTS = 'validationAllInputs';
export const SESSION_FLASH_INTENDS_KEY = 'flashIntend';

/** Metadata key set by @UseSession() */
export const USE_SESSION = 'session-manager:use-session';

/**
 * Routes that never get a session (no store read, no cookie): the versioned API, the OAuth
 * token endpoints, health checks and file delivery. Opt in per controller with @UseSession().
 */
export const STATELESS_ROUTES: readonly string[] = [
  'api/{*splat}',
  'oauth/token',
  'health',
  'files/{*splat}',
  'storage/{*splat}',
];
