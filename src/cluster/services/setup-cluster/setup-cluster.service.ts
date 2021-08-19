import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cluster from 'cluster';
import { Worker } from 'cluster';
import * as os from 'os';
import { ClusterConfig } from '../../../environment/interfaces/environment-types.interface';
import { Subject } from 'rxjs';

interface WorkerConfig {
  currentWorkerPid: number;
  attemptsRemaining: number;
  workerCpuId: number;
  allWorkerPid: number[];
}

@Injectable()
export class SetupClusterService {
  /**
   * Worker attempt check list
   * @private
   */
  private workerAttemptCheck: WorkerConfig[] = [];

  private bootstrapFunc: () => void;

  constructor(private configService: ConfigService) {}

  public closeEvent: Subject<true> = new Subject<true>();

  public start(bootstrap: () => void): void {
    this.bootstrapFunc = bootstrap;
    if (
      this.configService.get<ClusterConfig>('cluster').enable &&
      cluster.isPrimary
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
          this.configService.get<ClusterConfig>('cluster').maxWorkerAttempts,
        allWorkerPid: [],
      };
      this.workerAttemptCheck.push(workerConfig);
    }

    // worker being restarted as previous worker instance found. Updating the attempt count and other information
    if (!!previousWorker) {
      console.log('Checking attempts left to restart worker on cpu');
      const workerConfig = this.workerAttemptCheck.find(
        (worker) => worker.workerCpuId === workerCpuId,
      );
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
    );
    const worker = cluster.fork();
    workerConfig.allWorkerPid.push(worker.process.pid);
    workerConfig.currentWorkerPid = worker.process.pid;

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
      this.startWorker(workerCpuId, worker);
    });

    worker.on('online', () =>
      console.log(`Worker with pid ${worker.process.pid} is online`),
    );
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
    const maxCpu = this.configService.get<ClusterConfig>('cluster').cpuMax;

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
}
