import { Module } from '@nestjs/common';
import { GenerateAppSecretCommand } from './commands/generate-app-secret/generate-app-secret.command.js';
import { GenerateAppSecretService } from './commands/generate-app-secret/generate-app-secret.service.js';
import { GenerateOauthKeysCommand } from './commands/oauth/generate-private-keys/generate-oauth-keys.command.js';
import { GenerateOauthKeysService } from './commands/oauth/generate-private-keys/generate-oauth-keys.service.js';

/**
 * Commands that must run without the app's configuration (no EnvironmentModule, no database):
 * app:generate-secret creates the APP_SECRET that the configuration requires, and
 * oauth:generate-keys creates the JWT keys the app requires at boot.
 */
@Module({
  providers: [
    GenerateAppSecretService,
    GenerateAppSecretCommand,
    GenerateOauthKeysService,
    GenerateOauthKeysCommand,
  ],
})
export class StandaloneCommandsModule {}

/** Command names served by StandaloneCommandsModule */
export const STANDALONE_COMMANDS: readonly string[] = [
  'app:generate-secret',
  'oauth:generate-keys',
];
