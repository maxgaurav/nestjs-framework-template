import { CommunicationCommands } from '../cluster/communication-commands.js';

export interface InterProcessCommunication<T = unknown> {
  command: CommunicationCommands;
  message: T;
}
