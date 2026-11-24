import { AppModule } from './app.module';
import { HttpCommandFactory } from './cli-commands/http-command-factory/http-command.factory';
import { registerPgTypeParsers } from './helpers/pg-type-parsers/pg-type-parsers';
import { registerSequelizeCls } from './helpers/sequelize-namespace/sequelize-namespace';

registerPgTypeParsers();
registerSequelizeCls();

HttpCommandFactory.runHttp(AppModule, {
  // nest-commander's default only prints the error and exits 0; a failed command
  // (e.g. migration:run) must fail the shell/CI step
  serviceErrorHandler: (error: Error) => {
    console.error(error);
    process.exitCode = 1;
  },
})
  // Open handles (DB pool, cluster messaging) would keep the process alive
  .then(() => process.exit())
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
