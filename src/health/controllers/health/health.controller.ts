import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  SequelizeHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { ConnectionNames } from '../../../databases/connection-names';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memoryHealth: MemoryHealthIndicator,
    private configService: ConfigService,
    private sequelizeHealthCheck: SequelizeHealthIndicator,
    @InjectConnection(ConnectionNames.DefaultConnection)
    private defaultConnection: Sequelize,
  ) {}

  @Get()
  @HealthCheck()
  public check() {
    return this.health.check([
      () =>
        this.sequelizeHealthCheck.pingCheck(
          `database-${ConnectionNames.DefaultConnection}`,
          { connection: this.defaultConnection },
        ),
    ]);
  }
}
