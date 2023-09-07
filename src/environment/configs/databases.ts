import { ConnectionNames } from '../../databases/connection-names';
import {
  DatabaseConfig,
  DatabaseConnectionConfig,
} from '../interfaces/environment-types.interface';
import { ReplicationOptions } from 'sequelize';

export const databaseConfig = () => {
  const config: DatabaseConfig = {
    databases: {} as any,
  };

  config.databases[ConnectionNames.DefaultConnection] = {
    dialect: 'mysql',
    name: ConnectionNames.DefaultConnection,
    host: process.env.DB_HOST,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: !!process.env.DB_PORT ? parseFloat(process.env.DB_PORT) : 3306,
    pool: {
      max: !!process.env.DB_POOL_CONNECTION_LIMIT
        ? parseFloat(process.env.DB_POOL_CONNECTION_LIMIT)
        : 2,
      min: 1,
    },
    timezone: !!process.env.DB_TIMEZONE ? process.env.DB_TIMEZONE : '+00:00',
    logging: process.env.DB_DEBUG === 'true',
    benchmark: process.env.DB_DEBUG === 'true',
    replication: readWriteClusterSettings(),
    models: [__dirname + '/../../databases/models/**'],
    migrationDirectory: __dirname + '/../../databases/migrations',
    seedingDirectory: __dirname + '/../../databases/seeds',
  } as DatabaseConnectionConfig;
  return config;
};

interface ReadServerSetting {
  host?: string | undefined;
  port?: string | number | undefined;
  username?: string | undefined;
  password?: string | undefined;
  database?: string | undefined;
}

function setReadServerConfigValues(
  key: string,
  readServerConfig: ReadServerSetting,
) {
  if (key.includes('_HOST_')) {
    readServerConfig.host = process.env[key];
  }

  if (key.includes('_PORT_')) {
    readServerConfig.port = Number(process.env[key]);
  }

  if (key.includes('_NAME_')) {
    readServerConfig.database = process.env[key];
  }

  if (key.includes('_USERNAME_')) {
    readServerConfig.username = process.env[key];
  }

  if (key.includes('_PASSWORD_')) {
    readServerConfig.password = process.env[key];
  }
}

function readWriteClusterSettings(): ReplicationOptions | false {
  if (process.env.DB_USE_READ_WRITE_CLUSTER !== 'true') {
    return false;
  }

  const readServerMappings: Map<number, ReadServerSetting> = new Map();

  const test = process.env.DB_READ_HOST_SERVER_1;
  console.log(test);

  const readServerKeyCheck = new RegExp(
    /DB_READ_(HOST|NAME|USERNAME|PASSWORD|PORT)_SERVER_([1-9](\d+)?)/,
  );

  for (const key of Object.keys(process.env)) {
    if (!readServerKeyCheck.test(key)) {
      continue;
    }

    const index = Number(key.split('_SERVER_')[1]);
    const readServerConfig: ReadServerSetting = readServerMappings.has(index)
      ? readServerMappings.get(index)
      : {
          host: undefined,
          database: undefined,
          username: undefined,
          password: undefined,
          port: 3306,
        };

    setReadServerConfigValues(key, readServerConfig);
    readServerMappings.set(index, readServerConfig);
  }

  if (readServerMappings.size === 0) {
    throw new Error('Minimum of 1 read server mapping is required');
  }

  return {
    write: {
      host: process.env.DB_HOST,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: !!process.env.DB_PORT ? parseFloat(process.env.DB_PORT) : 3306,
    },
    read: Array.from(readServerMappings.values()),
  };
}
