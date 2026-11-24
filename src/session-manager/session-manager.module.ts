import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  Type,
} from '@nestjs/common';
import { DiscoveryModule, DiscoveryService, Reflector } from '@nestjs/core';
import { SessionConfigService } from './services/session-config/session-config.service.js';
import { SessionMapPreviousUrlInterceptor } from './interceptors/session-map-previous-url/session-map-previous-url-interceptor.service.js';
import { IntendManagerService } from './services/intend-manager/intend-manager.service.js';
import { RedirectFromLoginFilter } from './filters/redirect-to-login/redirect-to-login.filter.js';
import { SetupIntendInterceptor } from './interceptors/setup-intend/setup-intend.interceptor.js';
import { SessionMiddleware } from './middlewares/session/session.middleware.js';
import { SameOriginMiddleware } from './middlewares/same-origin/same-origin.middleware.js';
import { STATELESS_ROUTES, USE_SESSION } from './constants.js';

@Module({
  imports: [DiscoveryModule],
  providers: [
    SessionConfigService,
    SessionMapPreviousUrlInterceptor,
    IntendManagerService,
    RedirectFromLoginFilter,
    SetupIntendInterceptor,
  ],
})
export class SessionManagerModule implements NestModule {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
  ) {}

  configure(consumer: MiddlewareConsumer): void {
    // Web routes: session + flash. Stateless routes (API, token, health, files) get none.
    consumer
      .apply(SessionMiddleware)
      .exclude(
        ...STATELESS_ROUTES.map((path) => ({
          path,
          method: RequestMethod.ALL,
        })),
      )
      .forRoutes('{*splat}');

    // Opt-in: controllers marked @UseSession() (cookie-based auth on otherwise stateless routes)
    const optedIn = this.sessionControllers();
    if (optedIn.length > 0) {
      consumer
        .apply(SameOriginMiddleware, SessionMiddleware)
        .forRoutes(...optedIn);
    }
  }

  private sessionControllers(): Type[] {
    return this.discovery
      .getControllers()
      .map((wrapper) => wrapper.metatype as Type | null)
      .filter(
        (metatype): metatype is Type =>
          !!metatype &&
          this.reflector.get<boolean>(USE_SESSION, metatype) === true,
      );
  }
}
