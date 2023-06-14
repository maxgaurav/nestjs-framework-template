import { Module } from '@nestjs/common';
import { SessionConfigService } from './services/session-config/session-config.service';
import { SessionMapPreviousUrlInterceptor } from './interceptors/session-map-previous-url/session-map-previous-url-interceptor.service';
import { IntendManagerService } from './services/intend-manager/intend-manager.service';
import { RedirectFromLoginFilter } from './filters/redirect-to-login/redirect-to-login.filter';
import { SetupIntendInterceptor } from './interceptors/setup-intend/setup-intend.interceptor';
import { KillForApiInterceptor } from './interceptors/kill-for-api/kill-for-api.interceptor';

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
