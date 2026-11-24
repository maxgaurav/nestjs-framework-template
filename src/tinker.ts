import { repl } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { registerPgTypeParsers } from './helpers/pg-type-parsers/pg-type-parsers.js';
import { registerSequelizeCls } from './helpers/sequelize-namespace/sequelize-namespace.js';

registerPgTypeParsers();
registerSequelizeCls();

async function bootstrap() {
  await repl(AppModule);
}
bootstrap().catch((err) => {
  console.error(err);
});
