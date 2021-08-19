import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectionNames } from '../../../databases/connection-names';
import { DatabaseConnectionConfig } from '../../../environment/interfaces/environment-types.interface';

@Injectable()
export class DatabaseHelperService {
  constructor(private configService: ConfigService) {}

  /**
   * Returns database config as url string
   * @param connectionName
   */
  public databaseUrl(connectionName: ConnectionNames): string {
    const databaseConfig =
      this.configService.get<Record<ConnectionNames, DatabaseConnectionConfig>>(
        'databases',
      )[connectionName];
    const other = `${databaseConfig.username}:${databaseConfig.password}@${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}`;
    return `${databaseConfig.dialect}://${other}`;
  }

  /**
   * Returns migration directory
   * @param connectionName
   * @param replaceDist
   */
  public migrationPath(
    connectionName: ConnectionNames,
    replaceDist = false,
  ): string {
    const databaseConfig =
      this.configService.get<Record<ConnectionNames, DatabaseConnectionConfig>>(
        'databases',
      )[connectionName];

    const migrationDirectory = databaseConfig.migrationDirectory;

    if (replaceDist) {
      return migrationDirectory.replace('src', 'dist');
    }

    return migrationDirectory;
  }
}
