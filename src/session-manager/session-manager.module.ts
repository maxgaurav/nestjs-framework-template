import { Module } from '@nestjs/common';
import { SessionConfigService } from './services/session-config/session-config.service';

@Module({
  providers: [SessionConfigService],
})
export class SessionManagerModule {}
