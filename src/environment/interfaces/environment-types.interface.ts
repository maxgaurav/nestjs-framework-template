import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { ConnectionNames } from '../../databases/connection-names';

export interface SystemConfig {
  port: number;
  maxMemory: number;
  debug: boolean;
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
