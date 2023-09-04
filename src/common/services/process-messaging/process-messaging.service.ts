import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import {
  BroadcastCommandMessage,
  CommandToSystemEvent,
  CommunicationCommands,
} from '../../../cluster/communication-commands';
import { InterProcessCommunication } from '../../../interfaces/inter-process-communication';
import { finalize, Observable, Subject } from 'rxjs';
import { Worker } from 'cluster';
import * as cluster from 'cluster';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProcessMessagingService implements OnApplicationBootstrap {
  /**
   * The command emitter when command is receive
   * @protected
   */
  protected commandEmitter: Subject<InterProcessCommunication> =
    new Subject<InterProcessCommunication>();

  /**
   * Primary message sent without decoding or further processing done. (Raw message)
   * @protected
   */
  protected generalMessageEmitter: Subject<any> = new Subject<any>();

  constructor(
    private logger: Logger,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Hook on application bootstrap to start process message listening
   */
  public async onApplicationBootstrap(): Promise<void> {
    this.logger.log(
      `Starting to listen process messages for process with pid ${process.pid}`,
      'CommonModule',
    );
    process.on('message', (event: any | InterProcessCommunication) => {
      this.logger.debug(event, 'Message received on process');
      this.generalMessageEmitter.next(event);

      if (!event) {
        return;
      }

      if (event.hasOwnProperty('command') && event.hasOwnProperty('message')) {
        this.logger.debug(event, 'Command received on process');
        this.commandEmitter.next(event);
      }
    });

    this.subscribeToCommands().subscribe((commandReceived) =>
      this.convertCommandsToSystemEvents(commandReceived),
    );
  }

  /**
   * Subscribe to unprocessed message content for process
   */
  public subscribeToMessages<T = any>(): Observable<T> {
    return this.generalMessageEmitter.asObservable();
  }

  /**
   * Sends command from process to owner of process
   * @param command
   * @param message
   */
  public sendCommand<T = any>(
    command: CommunicationCommands,
    message: T,
  ): void {
    const messageStructure: InterProcessCommunication = { command, message };
    this.dispatchCommand(messageStructure);
  }

  protected dispatchCommand(message: InterProcessCommunication): void {
    if (this.isPrimaryProcess()) {
      this.convertCommandsToSystemEvents(message);
      return;
    }
    process.send(message);
  }

  /**
   * Returns true if process is primary master process
   */
  public isPrimaryProcess(): boolean {
    return (cluster as any).isPrimary;
  }

  /**
   * Broadcast the command to all worker's
   * @param message
   */
  public broadcastCommand<T = any>(message: BroadcastCommandMessage<T>): void {
    this.sendCommand<BroadcastCommandMessage<T>>(
      CommunicationCommands.BroadcastCommand,
      message,
    );
  }

  /**
   * Sends message through process to owner of process
   * @param worker
   * @param command
   * @param message
   */
  public sendCommandToWorker<T = any>(
    worker: Worker,
    command: CommunicationCommands,
    message: T,
  ): void {
    const messageStructure: InterProcessCommunication = { command, message };
    try {
      worker.send(messageStructure);
    } catch (err) {
      this.logger.error('Error sending command to worker');
      this.logger.error(err);
    }
  }

  /**
   * Subscribe to command's send to current process
   */
  public subscribeToCommands<T = any>(): Observable<
    InterProcessCommunication<T>
  > {
    return this.commandEmitter.asObservable();
  }

  /**
   * Subscribe to commands received from worker process
   * @param worker
   */
  public subscribeCommandsFromWorker<T = any>(
    worker: Worker,
  ): Observable<InterProcessCommunication<T>> {
    const emitter = new Subject<InterProcessCommunication<T>>();
    const handler = (event) => {
      if (!event) {
        return;
      }
      if (event.hasOwnProperty('command') && event.hasOwnProperty('message')) {
        emitter.next(event);
      }
    };
    worker.addListener('message', handler);

    return emitter.asObservable().pipe(
      finalize(() => {
        worker.removeListener('message', handler);
      }),
    );
  }

  /**
   * Sends out system event based on command received if mapped
   * @param commandReceived
   * @protected
   */
  public convertCommandsToSystemEvents(
    commandReceived: InterProcessCommunication,
  ): void {
    switch (commandReceived.command) {
      case CommunicationCommands.HealthCheckRequest:
        this.eventEmitter.emit(
          CommandToSystemEvent[commandReceived.command],
          commandReceived.message,
        );
        break;
      case CommunicationCommands.BroadcastCommand:
        const broadcastMessageCommand: BroadcastCommandMessage =
          commandReceived.message;
        this.convertCommandsToSystemEvents({
          command: broadcastMessageCommand.command as any,
          message: broadcastMessageCommand.message,
        });
        break;
      default:
        this.logger.warn(
          'System event not mapped for command',
          commandReceived,
        );
    }
  }
}
