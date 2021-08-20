import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { systemConfig } from './configs/system';
import { databaseConfig } from './configs/databases';
import { clusterConfig } from './configs/cluster';

// @todo check file exists and if not fall back
const overrideEnv = !!process.env.OVERRIDE_ENV
  ? `.${process.env.OVERRIDE_ENV}`
  : '';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [systemConfig, databaseConfig, clusterConfig],
      envFilePath: `.env${overrideEnv}`,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class EnvironmentModule {}
