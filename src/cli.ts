import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module.js';
import { HttpCommandFactory } from './cli-commands/http-command-factory/http-command.factory.js';
import {
  STANDALONE_COMMANDS,
  StandaloneCommandsModule,
} from './cli-commands/standalone-commands.module.js';
import { registerPgTypeParsers } from './helpers/pg-type-parsers/pg-type-parsers.js';
import { registerSequelizeCls } from './helpers/sequelize-namespace/sequelize-namespace.js';

registerPgTypeParsers();
registerSequelizeCls();

const options = {
  // nest-commander's default only prints the error and exits 0; a failed command
  // (e.g. migration:run) must fail the shell/CI step
  serviceErrorHandler: (error: Error) => {
    console.error(error.message);
    process.exitCode = 1;
  },
};

// Commands that create the configuration itself (APP_SECRET) cannot boot the app
const command = process.argv[2] ?? '';
const run = STANDALONE_COMMANDS.includes(command)
  ? CommandFactory.run(StandaloneCommandsModule, options)
  : HttpCommandFactory.runHttp(AppModule, options);

run
  // Open handles (DB pool, cluster messaging) would keep the process alive
  .then(() => process.exit())
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
