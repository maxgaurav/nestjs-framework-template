/**
 * Reads an environment variable that the app cannot run without, failing at boot with a clear
 * message instead of at first use (e.g. APP_SECRET signs sessions and derives encryption keys).
 * For config loaders only: app code reads values through ConfigService.
 */
export const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name} (see .env.example)`,
    );
  }
  return value;
};
