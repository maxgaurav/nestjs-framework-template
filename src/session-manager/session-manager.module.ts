import { Module } from '@nestjs/common';
import { SessionConfigService } from './services/session-config/session-config.service.js';
import { SessionMapPreviousUrlInterceptor } from './interceptors/session-map-previous-url/session-map-previous-url-interceptor.service.js';
import { IntendManagerService } from './services/intend-manager/intend-manager.service.js';
import { RedirectFromLoginFilter } from './filters/redirect-to-login/redirect-to-login.filter.js';
import { SetupIntendInterceptor } from './interceptors/setup-intend/setup-intend.interceptor.js';
import { KillForApiInterceptor } from './interceptors/kill-for-api/kill-for-api.interceptor.js';

@Module({
  providers: [
    SessionConfigService,
    SessionMapPreviousUrlInterceptor,
    IntendManagerService,
    RedirectFromLoginFilter,
    SetupIntendInterceptor,
    KillForApiInterceptor,
  ],
})
export class SessionManagerModule {}
