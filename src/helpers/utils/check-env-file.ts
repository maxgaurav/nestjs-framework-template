import { existsSync } from 'fs';

export const getEnvFileName = (envSuffix: string): string => {
  const isOverridden = envSuffix !== '';

  const defaultFile = `${process.cwd()}/.env`;

  if (isOverridden && existsSync(`${defaultFile}${envSuffix}`)) {
    return `${defaultFile}${envSuffix}`;
  }

  if (isOverridden) {
    console.warn(
      `Override file .env${envSuffix} not found falling back to .env`,
    );
  }

  if (!existsSync(defaultFile)) {
    console.warn(
      'Default environment .env not found default process env variables would be utilized',
    );
  }

  return defaultFile;
};

/**
 * The env file the app loads: `.env.<OVERRIDE_ENV>` when set and present, otherwise `.env`
 */
export const resolveEnvFilePath = (): string => {
  const overrideEnv = process.env['OVERRIDE_ENV'];
  return getEnvFileName(overrideEnv ? `.${overrideEnv}` : '');
};
