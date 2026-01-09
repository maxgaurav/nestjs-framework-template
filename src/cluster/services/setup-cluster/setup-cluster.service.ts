import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cluster from 'cluster';
import { Cluster, Worker } from 'cluster';
import * as os from 'os';
import { ClusterConfig } from '../../../environment/environment-types.interface';
import {
  auditTime,
  filter,
  interval,
  race,
  Subject,
  Subscription,
  switchMap,
  tap,
  timer,
} from 'rxjs';
import { ProcessMessagingService } from '../../../common/services/process-messaging/process-messaging.service';
import {
  BroadcastCommandMessage,
  CommunicationCommands,
} from '../../communication-commands';
import { map } from 'rxjs/operators';
import { HealthCheckResult } from '@nestjs/terminus';

const clusterManager: Cluster = cluster as any;

interface WorkerConfig {
  currentWorkerPid: number;
  attemptsRemaining: number;
  workerCpuId: number;
  allWorkerPid: number[];
  worker: Worker | null;
  broadcastSubscription?: Subscription | undefined;
  isOnline: boolean;
}

@Injectable()
export class SetupClusterService {
  /**
   * Worker attempt check list
   * @private
   */
  private workerAttemptCheck: WorkerConfig[] = [];

  private bootstrapFunc: () => void;

  constructor(
    private configService: ConfigService,
    private processMessaging: ProcessMessagingService,
  ) {}

  public closeEvent: Subject<true> = new Subject<true>();

  public start(bootstrap: () => void): void {
    this.bootstrapFunc = bootstrap;
    if (
      this.configService.getOrThrow<ClusterConfig>('cluster').enable &&
      clusterManager.isPrimary
    ) {
      this.startInWorker();
    } else {
      this.startInMain();
    }
  }

  /**
   * Start process in cluster
   * @protected
   */
  protected startInWorker() {
    for (let i = 1; i <= this.numberOfCpus(); i++) {
      this.startWorker(i);
    }
  }

  /**
   * Starts a worker process
   * @param workerCpuId
   * @param previousWorker
   * @protected
   */
  protected startWorker(workerCpuId: number, previousWorker?: Worker): void {
    // checking if the worker is being created for the first time. If so then setting up the worker config attempt
    if (!previousWorker) {
      const workerConfig: WorkerConfig = {
        workerCpuId,
        currentWorkerPid: -1,
        attemptsRemaining:
          this.configService.getOrThrow<ClusterConfig>('cluster')
            .maxWorkerAttempts,
        allWorkerPid: [],
        worker: null,
        isOnline: false,
      };
      this.workerAttemptCheck.push(workerConfig);
    }

    // worker being restarted as previous worker instance found. Updating the attempt count and other information
    if (!!previousWorker) {
      console.log('Checking attempts left to restart worker on cpu');
      const workerConfig = this.workerAttemptCheck.find(
        (worker) => worker.workerCpuId === workerCpuId,
      ) as WorkerConfig;
      console.log(
        `Retry attempts left on worker for cpu ${workerCpuId} are ${workerConfig.attemptsRemaining}`,
      );

      // checking if attempts have not exhausted if so then checking if all attempts from all workers are not exhausted
      // if so then the master system will exit and system will go down
      if (workerConfig.attemptsRemaining <= 0) {
        console.error(
          `Attempts exhausted to restart worker on cpu ${workerCpuId}.`,
        );
        this.checkAllWorkerRemainingAttempts();
        return;
      }

      workerConfig.attemptsRemaining -= 1;
    }

    const workerConfig = this.workerAttemptCheck.find(
      (worker) => worker.workerCpuId === workerCpuId,
    ) as WorkerConfig;
    const worker = clusterManager.fork();
    workerConfig.allWorkerPid.push(worker.process.pid as number);
    workerConfig.currentWorkerPid = worker.process.pid as number;
    workerConfig.worker = worker;

    this.setupSubscriptions(workerConfig, worker);

    console.log(
      `Worker being started on cpu: ${workerCpuId} with process id ${worker.process.pid}`,
    );

    worker.on('exit', (code, signal) => {
      console.warn(
        `Worker ${worker.process.pid} exited with code ${code} and signal ${signal}`,
      );
      console.warn(
        `Attempting to fork new worker for exited worker ${worker.process.pid}`,
      );
      workerConfig.isOnline = false;
      this.startWorker(workerCpuId, worker);
    });

    worker.on('online', () => {
      console.log(`Worker with pid ${worker.process.pid} is online`);
      workerConfig.isOnline = true;
      this.startHealthCheckOnWorker(worker);
    });
  }

  /**
   * Starts health check for worker
   * @param worker
   * @protected
   */
  protected startHealthCheckOnWorker(worker: Worker): void {
    // checking health of worker for every {configured time through config} in millisecond
    // if health check is not returned in 500 ms then system auto marks the health check as failed
    // if health check found is failed the auditing is started which monitors for audit attempts and decides to kill or keep
    console.log(
      `Starting health check for worker with pid ${worker.process.pid}`,
    );

    const healthCheckTimerConfig =
      this.configService.getOrThrow<ClusterConfig>('cluster').healthCheckConfig;

    const auditState = {
      isAuditing: false,
      totalChecks: healthCheckTimerConfig.totalAttempts,
      checks: 0,
      passedChecks: 0,
      threshold: healthCheckTimerConfig.thresholdPercentage,
      lastFailed: false,
      triggeredFinalHealthCheck: false,
    };

    const primaryCheckTimerObserver = interval(
      healthCheckTimerConfig.primaryCheckInterval,
    ).pipe(
      switchMap(() => {
        timer(10).subscribe(() =>
          this.processMessaging.sendCommandToWorker(
            worker,
            CommunicationCommands.HealthCheckRequest,
            null,
          ),
        );
        return race(
          this.processMessaging
            .subscribeCommandsFromWorker<HealthCheckResult>(worker)
            .pipe(
              filter(
                (commandReceived) =>
                  commandReceived.command ===
                  CommunicationCommands.HealthCheckStatus,
              ),
            )
            .pipe(
              map((commandReceived) => commandReceived.message.status === 'ok'),
            ),
          timer(500).pipe(map(() => false)),
        );
      }),
    );

    // auditing for attempts as configured default 15.
    // Audit starts when previous state is was not in audit mode and a failed health status is found other wise status is passed to auditor
    // for the attempts passed checks counter and attempt counter are kept in audit state
    //  skips final till main check counter equals total check counter
    // at final stage the auditor decides to keep or kill the process
    // it is wise to keep audit interval same of bit higher than main check interval
    const auditSubscription = primaryCheckTimerObserver
      .pipe(filter((healthState) => !(healthState && !auditState.isAuditing)))
      .pipe(
        tap((result) => {
          if (auditState.isAuditing === false) {
            console.log(
              `Worker with pid ${worker.process.pid} received failed health check. Starting audit process for health stability`,
            );
          }
          auditState.isAuditing = true;
          if (!!result) {
            auditState.passedChecks++;
          }
          auditState.checks++;
          auditState.lastFailed = !result;
        }),
      )
      .pipe(auditTime(healthCheckTimerConfig.auditInterval))
      .pipe(filter(() => auditState.checks >= auditState.totalChecks))
      .pipe(map(() => auditState))
      .subscribe((finalAuditStatus) => {
        console.log(
          `Health check data collected for audit of Worker with pid ${worker.process.pid}. Now auditing`,
        );
        if (
          (finalAuditStatus.passedChecks / finalAuditStatus.totalChecks) *
            100 >=
            finalAuditStatus.threshold &&
          !finalAuditStatus.lastFailed
        ) {
          console.log(
            `Main audit passed. Resetting audit state for worker ${worker.process.pid}`,
          );
          finalAuditStatus.isAuditing = false;
          finalAuditStatus.checks = 0;
          finalAuditStatus.passedChecks = 0;
          finalAuditStatus.lastFailed = false;
          return;
        }
        console.log(
          `Killing the worker with pid ${worker.process.pid} as health check audit failed`,
        );
        auditSubscription.unsubscribe();
        worker.kill();
      });
  }

  /**
   * Start process in main
   * @protected
   */
  protected startInMain() {
    this.bootstrapFunc();
  }

  /**
   * Number of cpus
   * @private
   */
  private numberOfCpus(): number {
    const numberOfCpus = os.cpus().length;
    const maxCpu =
      this.configService.getOrThrow<ClusterConfig>('cluster').cpuMax;

    if (maxCpu === 0) {
      return numberOfCpus;
    }

    return maxCpu <= numberOfCpus ? maxCpu : numberOfCpus;
  }

  /**
   * Checks if all the attempts on all the workers have exhausted. If so then exits the main process
   * @protected
   */
  protected checkAllWorkerRemainingAttempts(): void {
    const hasWorkerWithAttempts = !!this.workerAttemptCheck.find(
      (worker) => worker.attemptsRemaining > 0,
    );

    if (!hasWorkerWithAttempts) {
      console.error(
        'All attempts on restart worker on all cpu exhausted. Exiting the master process',
      );
      this.closeEvent.next(true);
    }
  }

  /**
   * Setups various subscription that master needs to have on worker and clear any that is no longer needed from
   * previous worker if any
   * @param workerConfig
   * @param worker
   * @protected
   */
  protected setupSubscriptions(
    workerConfig: WorkerConfig,
    worker: Worker,
  ): void {
    if (!!workerConfig.broadcastSubscription) {
      workerConfig.broadcastSubscription.unsubscribe();
    }

    workerConfig.broadcastSubscription = this.processMessaging
      .subscribeCommandsFromWorker<BroadcastCommandMessage>(worker)
      .pipe(
        filter(
          (commandMessage) =>
            commandMessage.command === CommunicationCommands.BroadcastCommand,
        ),
      )
      .subscribe((commandMessage) => {
        this.broadcastToAllWorkers(
          commandMessage.command,
          commandMessage.message,
        );
      });
  }

  /**
   * Broadcast command to all workers
   * @param command
   * @param message
   */
  public broadcastToAllWorkers<T = any>(
    command: CommunicationCommands,
    message: T,
  ): void {
    this.workerAttemptCheck
      .filter((worker) => worker.isOnline)
      .forEach((worker) =>
        this.processMessaging.sendCommandToWorker(
          worker.worker as never,
          command,
          message,
        ),
      );
  }
}
