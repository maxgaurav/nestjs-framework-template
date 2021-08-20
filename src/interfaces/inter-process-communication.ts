import { CommunicationCommands } from '../cluster/communication-commands';

export interface InterProcessCommunication<T extends any = any> {
  command: CommunicationCommands;
  message: T;
}
