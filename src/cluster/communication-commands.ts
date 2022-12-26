import { SystemEvents } from '../system-events/system-events';

export interface BroadcastCommandMessage<T = any> {
  command: Omit<CommunicationCommands, 'BroadcastCommand'>;
  message: T;
}

export enum CommunicationCommands {
  HealthCheckRequest = 'health-check-request',
  HealthCheckStatus = 'health-check-status',
  BroadcastCommand = 'broadcast-command',
}

// @todo map keys to command enum names
export const CommandToSystemEvent: { [k: string]: SystemEvents } = {};
CommandToSystemEvent[CommunicationCommands.HealthCheckRequest] =
  SystemEvents.SelfHealthStatus;
