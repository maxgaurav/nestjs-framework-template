import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { systemConfig } from './configs/system';
import { databaseConfig } from './configs/databases';
import { clusterConfig } from './configs/cluster';
import { getEnvFileName } from '../helpers/utils/check-env-file';

const envSuffix = !!process.env.OVERRIDE_ENV
  ? `.${process.env.OVERRIDE_ENV}`
  : '';

const envFileName = getEnvFileName(envSuffix);

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [systemConfig, databaseConfig, clusterConfig],
      envFilePath: envFileName,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class EnvironmentModule {}
