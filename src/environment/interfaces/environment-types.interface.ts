import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { ConnectionNames } from '../../databases/connection-names';
import { MailerOptions } from '@nestjs-modules/mailer';
import { SessionOptions } from 'express-session';

export interface SystemConfig {
  port: number;
  url: string;
  secret: string;
  maxHeapMemory: number;
  maxRssMemory: number;
  debug: boolean;
  checkMemory: boolean;
}

export interface ClusterConfig {
  enable: boolean;
  cpuMax: number;
  maxWorkerAttempts: number;
  healthCheckConfig: {
    primaryCheckInterval: number;
    auditInterval: number;
    thresholdPercentage: number;
    totalAttempts: number;
  };
}

export interface DatabaseConnectionConfig extends SequelizeModuleOptions {
  migrationDirectory: string;
  seedingDirectory: string;
}

export interface DatabaseConfig {
  databases: Record<ConnectionNames, DatabaseConnectionConfig>;
}

export interface MailConfig extends MailerOptions {
  driver: 'log' | 'smtp';
}

export interface SessionConfig extends Partial<SessionOptions> {
  driver: 'memory' | 'file';
}

export interface JwtConfig {
  expirationTimeAccessToken: number | null;
  expirationTimeRefreshToken: number | null;
}

export interface ViewConfig {
  viewPath: string;
  publicPath: string;
}
