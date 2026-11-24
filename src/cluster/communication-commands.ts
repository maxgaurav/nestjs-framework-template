import { SystemEvents } from '../system-events/system-events.js';

export interface BroadcastCommandMessage<T = unknown> {
  command: Omit<CommunicationCommands, 'BroadcastCommand'>;
  message: T;
}

export enum CommunicationCommands {
  HealthCheckRequest = 'health-check-request',
  HealthCheckStatus = 'health-check-status',
  BroadcastCommand = 'broadcast-command',
}

export const CommandToSystemEvent: Partial<
  Record<CommunicationCommands, SystemEvents>
> = {
  [CommunicationCommands.HealthCheckRequest]: SystemEvents.SelfHealthStatus,
};
