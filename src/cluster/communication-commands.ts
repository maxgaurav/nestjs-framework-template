import { SystemEvents } from '../system-events/system-events';

export enum CommunicationCommands {
  HealthCheckRequest = 'health-check-request',
  HealthCheckStatus = 'health-check-status',
}

// @todo map keys to command enum names
export const CommandToSystemEvent: { [k: string]: SystemEvents } = {};
CommandToSystemEvent[CommunicationCommands.HealthCheckRequest] =
  SystemEvents.SelfHealthStatus;
