import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { DatabasesModule } from '../databases/databases.module.js';
import { HealthController } from './controllers/health/health.controller.js';

@Module({
  imports: [ConfigModule, TerminusModule, DatabasesModule],
  controllers: [HealthController],
  providers: [],
})
export class HealthModule {}
