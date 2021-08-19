import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { ConnectionNames } from '../../databases/connection-names';

export interface SystemConfig {
  port: number;
  maxMemory: number;
}

export interface ClusterConfig {
  enable: boolean;
  cpuMax: number;
  maxWorkerAttempts: number;
}

export interface DatabaseConnectionConfig extends SequelizeModuleOptions {
  migrationDirectory: string;
  seedingDirectory: string;
}

export interface DatabaseConfig {
  databases: Record<ConnectionNames, DatabaseConnectionConfig>;
}
