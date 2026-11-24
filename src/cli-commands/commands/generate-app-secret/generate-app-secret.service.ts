import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export const APP_SECRET_KEY = 'APP_SECRET';

/** What rotating APP_SECRET breaks; printed when an existing secret is replaced */
export const APP_SECRET_ROTATION_WARNING = [
  'APP_SECRET was replaced. Rotating it:',
  '  - logs out every session (they are signed with it);',
  '  - makes values encrypted with HashEncryptService undecryptable;',
  '  - changes storage signing keys derived from it (when STORAGE_SIGNING_KEYS is empty),',
  '    so outstanding signed links stop working.',
].join('\n');

export class AppSecretExistsError extends Error {
  constructor(envFile: string) {
    super(
      `${APP_SECRET_KEY} is already set in ${envFile}. Use --force to replace it (see the rotation warning in --help).`,
    );
  }
}

export interface GenerateAppSecretResult {
  envFile: string;
  /** An existing non-empty secret was overwritten */
  replaced: boolean;
  /** The env file did not exist and was created */
  created: boolean;
}

const LINE = new RegExp(`^\\s*${APP_SECRET_KEY}\\s*=(.*)$`);

/** Current value of APP_SECRET in env-file text, without quotes; '' when absent or empty */
export const readAppSecret = (envText: string): string => {
  for (const line of envText.split(/\r?\n/)) {
    const match = LINE.exec(line);
    if (match) {
      return (match[1] ?? '').trim().replace(/^(['"])(.*)\1$/, '$2');
    }
  }
  return '';
};

/**
 * Sets APP_SECRET in env-file text: replaces its line in place, or appends it.
 * Every other line (and the line endings) is kept as is.
 */
export const upsertAppSecret = (envText: string, secret: string): string => {
  const eol = envText.includes('\r\n') ? '\r\n' : '\n';
  const lines = envText.length > 0 ? envText.split(/\r?\n/) : [];
  const index = lines.findIndex((line) => LINE.test(line));

  if (index >= 0) {
    lines[index] = `${APP_SECRET_KEY}=${secret}`;
    return lines.join(eol);
  }

  // Append before the trailing empty line, keeping a final newline
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.splice(lines.length - 1, 0, `${APP_SECRET_KEY}=${secret}`);
    return lines.join(eol);
  }
  return [...lines, `${APP_SECRET_KEY}=${secret}`, ''].join(eol);
};

/**
 * Generates and stores APP_SECRET. Pure file work: no app config, so it can create the very
 * first secret of a fresh environment.
 */
@Injectable()
export class GenerateAppSecretService {
  /** 32 random bytes as 64 hex characters */
  public generate(): string {
    return randomBytes(32).toString('hex');
  }

  public writeToEnvFile(
    envFile: string,
    secret: string,
    force = false,
  ): GenerateAppSecretResult {
    const created = !existsSync(envFile);
    const current = created ? '' : readFileSync(envFile, 'utf8');
    const replaced = readAppSecret(current) !== '';

    if (replaced && !force) {
      throw new AppSecretExistsError(envFile);
    }

    // writeFileSync on an existing file keeps its mode
    writeFileSync(envFile, upsertAppSecret(current, secret));
    return { envFile, replaced, created };
  }
}
