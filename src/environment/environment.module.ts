import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { systemConfig } from './configs/system.js';
import { databaseConfig } from './configs/databases.js';
import { clusterConfig } from './configs/cluster.js';
import { getEnvFileName } from '../helpers/utils/check-env-file.js';
import { mailConfig } from './configs/mail.js';
import { sessionConfig } from './configs/session.js';
import { jwtConfig } from './configs/jwt.js';
import { viewConfig } from './configs/view.js';
import { storageConfig } from './configs/storage.js';
import { corsConfig } from './configs/cors.js';

const envSuffix = process.env.OVERRIDE_ENV
  ? `.${process.env.OVERRIDE_ENV}`
  : '';

const envFileName = getEnvFileName(envSuffix);

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        systemConfig,
        databaseConfig,
        clusterConfig,
        mailConfig,
        sessionConfig,
        jwtConfig,
        viewConfig,
        storageConfig,
        corsConfig,
      ],
      envFilePath: envFileName,
      isGlobal: true,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class EnvironmentModule {}
