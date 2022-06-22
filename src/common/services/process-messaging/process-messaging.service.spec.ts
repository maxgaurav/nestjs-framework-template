import { Test, TestingModule } from '@nestjs/testing';
import { ProcessMessagingService } from './process-messaging.service';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { firstValueFrom, of, timer } from 'rxjs';
import { InterProcessCommunication } from '../../../interfaces/inter-process-communication';
import {
  BroadcastCommandMessage,
  CommunicationCommands,
} from '../../../cluster/communication-commands';
import { catchError, map } from 'rxjs/operators';
import { Worker } from 'cluster';
import { SystemEvents } from '../../../system-events/system-events';

describe('ProcessMessagingService', () => {
  let service: ProcessMessagingService;
  let processOnSpy: jest.SpyInstance;
  let onHandler: any | ((event) => void);
  let eventType: any;

  const eventEmitter = {
    emit: (value) => value,
  };

  beforeEach(async () => {
    processOnSpy = jest
      .spyOn(process, 'on')
      .mockImplementation((type: string, callback: any | ((event) => void)) => {
        eventType = type;
        onHandler = callback;
        return this;
      });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessMessagingService,
        {
          provide: Logger,
          useValue: console,
        },
        {
          provide: EventEmitter2,
          useValue: eventEmitter,
        },
      ],
    }).compile();

    service = module.get<ProcessMessagingService>(ProcessMessagingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should trigger general message subject on message received', async () => {
    const data = 'sample';
    service.onApplicationBootstrap();
    expect(processOnSpy).toHaveBeenCalled();
    expect(typeof eventType).toEqual('string');
    expect(eventType).toEqual('message');
    expect(typeof onHandler).toEqual('function');

    const [result] = await Promise.all([
      firstValueFrom(service.subscribeToMessages()),
      Promise.resolve(onHandler(data)),
    ]);
    expect(result).toEqual(data);
  });

  it('should not trigger command message subject on message received is empty', async () => {
    const data = null;
    service.onApplicationBootstrap();
    expect(processOnSpy).toHaveBeenCalled();
    expect(typeof eventType).toEqual('string');
    expect(eventType).toEqual('message');
    expect(typeof onHandler).toEqual('function');

    const [result] = await Promise.all([
      Promise.race([
        firstValueFrom(service.subscribeToCommands()),
        firstValueFrom(timer(100).pipe(map(() => false))),
      ]),
      Promise.resolve(onHandler(data)),
    ]);
    expect(result).toEqual(false);
  });

  it('should not trigger command message subject on message received is not right structure', async () => {
    const data = {};
    service.onApplicationBootstrap();
    expect(processOnSpy).toHaveBeenCalled();
    expect(typeof eventType).toEqual('string');
    expect(eventType).toEqual('message');
    expect(typeof onHandler).toEqual('function');

    const [result] = await Promise.all([
      Promise.race([
        firstValueFrom(service.subscribeToCommands()),
        firstValueFrom(timer(100).pipe(map(() => false))),
      ]),
      Promise.resolve(onHandler(data)),
    ]);
    expect(result).toEqual(false);
  });

  it('should trigger general message and command subject on message received as command', async () => {
    const data: InterProcessCommunication = {
      command: CommunicationCommands.HealthCheckStatus,
      message: 'sample',
    };
    service.onApplicationBootstrap();
    expect(processOnSpy).toHaveBeenCalled();
    expect(typeof eventType).toEqual('string');
    expect(eventType).toEqual('message');
    expect(typeof onHandler).toEqual('function');

    const [result] = await Promise.all([
      firstValueFrom(service.subscribeToMessages()),
      firstValueFrom(service.subscribeToCommands()),
      Promise.resolve(onHandler(data)),
    ]);
    expect(result).toEqual(data);
  });

  it('should send command through send action', () => {
    const sendSpy = jest.spyOn(process, 'send');
    const isPrimary = jest
      .spyOn(service, 'isPrimaryProcess')
      .mockReturnValue(false);
    service.sendCommand(CommunicationCommands.HealthCheckStatus, null);
    expect(isPrimary).toHaveBeenCalled();
    expect(sendSpy).toHaveBeenCalledWith({
      command: CommunicationCommands.HealthCheckStatus,
      message: null,
    });
  });

  it('should send command through send action will convert to self event', () => {
    const convertToSystemEvent = jest
      .spyOn(service, 'convertCommandsToSystemEvents')
      .mockImplementation();
    const isPrimary = jest
      .spyOn(service, 'isPrimaryProcess')
      .mockReturnValue(true);
    service.sendCommand(CommunicationCommands.HealthCheckStatus, null);
    expect(isPrimary).toHaveBeenCalled();
    expect(convertToSystemEvent).toHaveBeenCalledWith({
      command: CommunicationCommands.HealthCheckStatus,
      message: null,
    });
  });

  it('should send command to worker', () => {
    const worker: Worker = { send: (value) => value } as any;
    const sendSpy = jest.spyOn(worker, 'send');

    service.sendCommandToWorker(
      worker,
      CommunicationCommands.HealthCheckStatus,
      null,
    );

    expect(sendSpy).toHaveBeenCalledWith({
      command: CommunicationCommands.HealthCheckStatus,
      message: null,
    });
  });

  it('should log errors when send command to worker fails', () => {
    const worker: Worker = { send: (value) => value } as any;
    const sendSpy = jest.spyOn(worker, 'send').mockImplementation(() => {
      throw new Error();
    });

    const errorLogSpy = jest.spyOn(console, 'error');

    service.sendCommandToWorker(
      worker,
      CommunicationCommands.HealthCheckStatus,
      null,
    );

    expect(sendSpy).toHaveBeenCalledWith({
      command: CommunicationCommands.HealthCheckStatus,
      message: null,
    });

    expect(errorLogSpy).toBeCalledTimes(2);
  });

  it('should receive command from worker when subscribed and command is received', async () => {
    let messageHandler;
    let eventType;
    const worker: Worker = {
      addListener: (value) => value,
      removeListener: (value, handler) => ({ value, handler }),
    } as any;
    const listenerSpy = jest
      .spyOn(worker, 'addListener')
      .mockImplementation((eventName, handler) => {
        eventType = eventName;
        messageHandler = handler;
        return this;
      });

    const subscription = service.subscribeCommandsFromWorker(worker);
    const data: InterProcessCommunication = {
      command: CommunicationCommands.HealthCheckStatus,
      message: null,
    };

    expect(listenerSpy).toHaveBeenCalled();
    expect(eventType).toEqual('message');
    expect(typeof messageHandler).toEqual('function');

    const [result] = await Promise.all([
      firstValueFrom(subscription),
      Promise.resolve(messageHandler(data)),
    ]);

    expect(result).toEqual(data);
  });

  it('should not receive command from worker when subscribed and command is empty', async () => {
    let messageHandler;
    let eventType;
    const worker: Worker = {
      addListener: (value) => value,
      removeListener: (value, handler) => ({ value, handler }),
    } as any;
    const listenerSpy = jest
      .spyOn(worker, 'addListener')
      .mockImplementation((eventName, handler) => {
        eventType = eventName;
        messageHandler = handler;
        return worker;
      });

    const commandListener = service.subscribeCommandsFromWorker(worker).pipe(
      catchError((err) => {
        console.error('CHECK TEST CASE. Some error is happening', err);
        return of(true);
      }),
    );
    const data = null;

    expect(listenerSpy).toHaveBeenCalled();
    expect(eventType).toEqual('message');
    expect(typeof messageHandler).toEqual('function');

    const [result] = await Promise.all([
      Promise.race([
        firstValueFrom(commandListener),
        firstValueFrom(timer(100).pipe(map(() => false))),
      ]),
      Promise.resolve(messageHandler(data)),
    ]);

    expect(result).toEqual(false);
  });

  it('should not receive command from worker when subscribed and command is not structured correct', async () => {
    let messageHandler;
    let eventType;
    const worker: Worker = {
      addListener: (value) => value,
      removeListener: (value, handler) => ({ value, handler }),
    } as any;
    const listenerSpy = jest
      .spyOn(worker, 'addListener')
      .mockImplementation((eventName, handler) => {
        eventType = eventName;
        messageHandler = handler;
        return worker;
      });

    const subscription = service.subscribeCommandsFromWorker(worker);
    const data = {};

    expect(listenerSpy).toHaveBeenCalled();
    expect(eventType).toEqual('message');
    expect(typeof messageHandler).toEqual('function');

    const [result] = await Promise.all([
      Promise.race([
        firstValueFrom(subscription),
        firstValueFrom(timer(100).pipe(map(() => false))),
      ]),
      Promise.resolve(messageHandler(data)),
    ]);

    expect(result).toEqual(false);
  });

  it('should trigger warning when command is not found/mapped', () => {
    const warnSpy = jest.spyOn(console, 'warn');
    service.convertCommandsToSystemEvents({
      command: 'fail' as any,
      message: null,
    });
    expect(warnSpy).toHaveBeenCalled();
  });

  it('should emit health check system event on health check command', () => {
    const emitSpy = jest.spyOn(eventEmitter, 'emit');
    service.convertCommandsToSystemEvents({
      command: CommunicationCommands.HealthCheckRequest,
      message: null,
    });

    expect(emitSpy).toHaveBeenCalledWith(SystemEvents.SelfHealthStatus, null);
  });

  it('should recursively call system event converter when broadcast command is found', () => {
    const emitSpy = jest.spyOn(eventEmitter, 'emit');
    service.convertCommandsToSystemEvents({
      command: CommunicationCommands.BroadcastCommand,
      message: {
        message: null,
        command: CommunicationCommands.HealthCheckRequest,
      } as BroadcastCommandMessage,
    });

    expect(emitSpy).toHaveBeenCalledWith(SystemEvents.SelfHealthStatus, null);
  });
});
