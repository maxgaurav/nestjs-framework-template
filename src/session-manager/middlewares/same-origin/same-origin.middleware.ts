import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import {
  CorsConfig,
  SystemConfig,
} from '../../../environment/environment-types.interface.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const originOf = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

/**
 * CSRF protection for cookie-authenticated (@UseSession) routes: a state-changing request must
 * come from the app's own origin or an explicitly allowed CORS origin. Browsers always send
 * `Origin` on cross-site POST/PUT/PATCH/DELETE; `Referer` is the fallback.
 */
@Injectable()
export class SameOriginMiddleware implements NestMiddleware {
  private readonly allowed: Set<string>;

  constructor(configService: ConfigService) {
    const system = configService.getOrThrow<SystemConfig>('system');
    const cors = configService.getOrThrow<CorsConfig>('cors');
    this.allowed = new Set(
      [system.url, ...cors.origins.filter((origin) => origin !== '*')]
        .map((origin) => originOf(origin))
        .filter((origin): origin is string => origin !== null),
    );
  }

  use(req: Request, _res: Response, next: NextFunction): void {
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
      next();
      return;
    }

    const origin = originOf(req.header('origin') ?? req.header('referer'));
    if (!origin || !this.allowed.has(origin)) {
      next(new ForbiddenException('Cross-site request rejected'));
      return;
    }
    next();
  }
}
