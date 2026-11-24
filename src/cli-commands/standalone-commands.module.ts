import { Module } from '@nestjs/common';
import { GenerateAppSecretCommand } from './commands/generate-app-secret/generate-app-secret.command.js';
import { GenerateAppSecretService } from './commands/generate-app-secret/generate-app-secret.service.js';

/**
 * Commands that must run without the app's configuration (no EnvironmentModule, no database):
 * app:generate-secret creates the APP_SECRET that the configuration requires.
 */
@Module({
  providers: [GenerateAppSecretService, GenerateAppSecretCommand],
})
export class StandaloneCommandsModule {}

/** Command names served by StandaloneCommandsModule */
export const STANDALONE_COMMANDS: readonly string[] = ['app:generate-secret'];
