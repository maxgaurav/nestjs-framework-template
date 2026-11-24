import { Command, CommandRunner } from 'nest-commander';
import { $enum } from 'ts-enum-util';
import { GenerateClientService } from './generate-client.service';
import { GrantTypes } from '../../../../auth/grant-types/grant-type-implementation';

@Command({
  name: 'oauth:generate-client',
  arguments: '<name> <grantType>',
  description: 'Generate a new client id and secret',
  argsDescription: {
    name: 'Name of the client',
    grantType: `Grant type of the client (${$enum(GrantTypes).getValues().join(', ')})`,
  },
})
export class GenerateClientCommand extends CommandRunner {
  constructor(private readonly service: GenerateClientService) {
    super();
  }

  async run([name, grantType]: string[]): Promise<void> {
    if (!$enum(GrantTypes).isValue(grantType)) {
      throw new Error(
        `Invalid grant type "${grantType}". Allowed: ${$enum(GrantTypes).getValues().join(', ')}`,
      );
    }
    await this.service.generateClient(name, grantType);
  }
}
