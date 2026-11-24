import { Command, CommandRunner } from 'nest-commander';
import { GenerateOauthKeysService } from './generate-oauth-keys.service.js';

@Command({
  name: 'oauth:generate-keys',
  description: 'Generate the private and public keys for JWT',
})
export class GenerateOauthKeysCommand extends CommandRunner {
  constructor(private readonly service: GenerateOauthKeysService) {
    super();
  }

  async run(): Promise<void> {
    await this.service.generateKeys();
  }
}
