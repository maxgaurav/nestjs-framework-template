import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { DatabasesModule } from '../databases/databases.module';
import { HealthController } from './controllers/health/health.controller';

@Module({
  imports: [ConfigModule, TerminusModule, DatabasesModule],
  controllers: [HealthController],
  providers: [],
})
export class HealthModule {}
