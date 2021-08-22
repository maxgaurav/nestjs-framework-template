import { Module } from '@nestjs/common';
import { SessionConfigService } from './services/session-config/session-config.service';
import { SessionMapPreviousUrlInterceptor } from './interceptors/session-map-previous-url/session-map-previous-url-interceptor.service';

@Module({
  providers: [SessionConfigService, SessionMapPreviousUrlInterceptor],
})
export class SessionManagerModule {}
