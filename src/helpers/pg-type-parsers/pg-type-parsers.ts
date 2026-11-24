import { types } from 'pg';

/**
 * Registers global pg type parsers. Call it at the top of every entry point
 * (app, CLI, REPL, e2e setup) so all of them read the same values.
 */
export const registerPgTypeParsers = (): void => {
  // BIGINT / COUNT(*) come back as strings by default; ids and counts fit in a JS number
  types.setTypeParser(types.builtins.INT8, (value: string) =>
    parseInt(value, 10),
  );
};
