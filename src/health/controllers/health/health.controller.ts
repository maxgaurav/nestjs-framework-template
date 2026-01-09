import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  MemoryHealthIndicator,
  SequelizeHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { ConnectionNames } from '../../../databases/connection-names';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { OnEvent } from '@nestjs/event-emitter';
import { SystemEvents } from '../../../system-events/system-events';
import { ProcessMessagingService } from '../../../common/services/process-messaging/process-messaging.service';
import { CommunicationCommands } from '../../../cluster/communication-commands';
import { SystemConfig } from '../../../environment/environment-types.interface';
import { HealthIndicatorFunction } from '@nestjs/terminus/dist/health-indicator';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memoryHealth: MemoryHealthIndicator,
    private configService: ConfigService,
    private sequelizeHealthCheck: SequelizeHealthIndicator,
    @InjectConnection(ConnectionNames.DefaultConnection)
    private defaultConnection: Sequelize,
    private processMessaging: ProcessMessagingService,
  ) {}

  /**
   * Main health check action
   */
  @Get()
  @HealthCheck()
  public check() {
    const systemConfig = this.configService.getOrThrow<SystemConfig>('system');
    const checks: HealthIndicatorFunction[] = [
      () =>
        this.sequelizeHealthCheck.pingCheck(
          `database-${ConnectionNames.DefaultConnection}`,
          { connection: this.defaultConnection },
        ),
    ];

    if (systemConfig.checkMemory) {
      checks.push(
        () =>
          this.memoryHealth.checkRSS(
            'process-rss-memory',
            systemConfig.maxRssMemory,
          ),
        () =>
          this.memoryHealth.checkHeap(
            'process-heap-memory',
            systemConfig.maxHeapMemory,
          ),
      );
    }

    return this.health.check(checks);
  }

  /**
   * Triggers health check and sends information to master process
   */
  @OnEvent(SystemEvents.SelfHealthStatus)
  public checkOnCommand() {
    let result: HealthCheckResult | Error;

    this.check()
      .then((status) => {
        result = status;
      })
      .catch((err: Error) => {
        result = err;
      })
      .finally(() =>
        this.processMessaging.sendCommand<HealthCheckResult | Error>(
          CommunicationCommands.HealthCheckStatus,
          result,
        ),
      );
  }
}
