import { Command, CommandRunner, Option } from 'nest-commander';
import { GenerateOauthKeysService } from './generate-oauth-keys.service.js';

interface GenerateOauthKeysOptions {
  force?: boolean;
}

@Command({
  name: 'oauth:generate-keys',
  description:
    'Generate the RS256 key pair for bearer tokens in storage/. Replacing existing keys (--force) invalidates every issued token.',
})
export class GenerateOauthKeysCommand extends CommandRunner {
  constructor(private readonly service: GenerateOauthKeysService) {
    super();
  }

  async run(
    _params: string[],
    options: GenerateOauthKeysOptions,
  ): Promise<void> {
    const result = await this.service.generateKeys(options.force ?? false);
    console.log(
      `JWT keys ${result.replaced ? 'replaced' : 'created'}: ${result.privateKeyPath}, ${result.publicKeyPath}`,
    );
    if (result.replaced) {
      console.warn(
        'Every previously issued access and refresh token is now invalid.',
      );
    }
  }

  @Option({
    flags: '--force',
    description: 'Replace existing keys (invalidates all issued tokens)',
  })
  parseForce(): boolean {
    return true;
  }
}
