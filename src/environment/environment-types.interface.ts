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
  secret: string;
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

export interface S3StorageConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  forcePathStyle: boolean;
  /** Unset to fall back to the AWS_* environment credentials */
  credentials?: { accessKeyId: string; secretAccessKey: string };
}

export interface StorageConfig {
  driver: 'local' | 's3';
  /** Local: folder holding the private/ and public/ disks. S3: key prefix in the bucket */
  root: string;
  /** First key signs, every key verifies (rotation); each at least 32 characters */
  signingKeys: string[];
  /** Absolute URL of the route that serves signed links of local disks */
  signedUrlBase: string;
  /** Base URL of the public disk (static route, public bucket or CDN) */
  publicUrl: string;
  s3: S3StorageConfig;
}

export interface CorsConfig {
  origins: string[];
}
