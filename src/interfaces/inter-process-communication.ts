import { CommunicationCommands } from '../cluster/communication-commands';

export interface InterProcessCommunication<T = unknown> {
  command: CommunicationCommands;
  message: T;
}
