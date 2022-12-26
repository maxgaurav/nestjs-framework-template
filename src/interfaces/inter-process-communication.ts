import { CommunicationCommands } from '../cluster/communication-commands';

export interface InterProcessCommunication<T = any> {
  command: CommunicationCommands;
  message: T;
}
