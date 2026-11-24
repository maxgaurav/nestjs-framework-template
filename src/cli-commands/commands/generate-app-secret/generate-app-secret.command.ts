import { Command, CommandRunner, Option } from 'nest-commander';
import { resolveEnvFilePath } from '../../../helpers/utils/check-env-file.js';
import {
  APP_SECRET_ROTATION_WARNING,
  GenerateAppSecretService,
} from './generate-app-secret.service.js';

interface GenerateAppSecretOptions {
  show?: boolean;
  force?: boolean;
}

@Command({
  name: 'app:generate-secret',
  description:
    'Generate a new APP_SECRET and write it to the env file. Replacing an existing secret (--force) logs out all sessions, breaks values encrypted with it and invalidates derived signed links.',
})
export class GenerateAppSecretCommand extends CommandRunner {
  constructor(private readonly service: GenerateAppSecretService) {
    super();
  }

  run(_params: string[], options: GenerateAppSecretOptions): Promise<void> {
    const secret = this.service.generate();

    if (options.show) {
      // stdout only, so it can be piped into a secret manager
      process.stdout.write(`${secret}\n`);
      return Promise.resolve();
    }

    const result = this.service.writeToEnvFile(
      resolveEnvFilePath(),
      secret,
      options.force ?? false,
    );
    // The value is never printed here, so it does not end up in terminal logs
    console.log(
      `APP_SECRET ${result.replaced ? 'replaced' : 'set'} in ${result.envFile}${result.created ? ' (file created; copy the other settings from .env.example)' : ''}`,
    );
    if (result.replaced) {
      console.warn(APP_SECRET_ROTATION_WARNING);
    }
    return Promise.resolve();
  }

  @Option({
    flags: '--show',
    description: 'Print a new secret without changing any file',
  })
  parseShow(): boolean {
    return true;
  }

  @Option({
    flags: '--force',
    description: 'Replace an existing APP_SECRET (see the rotation warning)',
  })
  parseForce(): boolean {
    return true;
  }
}
