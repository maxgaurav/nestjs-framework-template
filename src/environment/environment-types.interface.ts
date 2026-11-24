import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { ConnectionNames } from '../databases/connection-names.js';
import type { SmtpTransportOptions } from '@nestjs/mail';
import { SessionOptions } from 'express-session';

export interface SystemConfig {
  port: number;
  url: string;
  secret: string;
  encryptHexKey: string;
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
  migrationSourceDirectory: string;
}

export interface DatabaseConfig {
  databases: Record<ConnectionNames, DatabaseConnectionConfig>;
}

export interface MailConfig {
  driver: 'smtp' | 'log' | 'memory';
  from: { name: string; address: string };
  retry: number;
  smtp: SmtpTransportOptions;
}

export interface SessionConfig extends Partial<SessionOptions> {
  driver: 'memory' | 'file';
  secureCookie: boolean;
}

export interface JwtConfig {
  expirationTimeAccessToken: number | null;
  expirationTimeRefreshToken: number | null;
}

export interface ViewConfig {
  viewPath: string;
  publicPath: string;
  templateCaching: boolean;
}

export type FilesystemNames = 'local';
export interface FilesystemConfig {
  defaultDriver: FilesystemNames;
}

export interface CorsConfig {
  origins: string[];
}
