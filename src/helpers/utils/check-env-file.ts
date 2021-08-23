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
