import { repl } from '@nestjs/core';
import { AppModule } from './app.module';
import { registerPgTypeParsers } from './helpers/pg-type-parsers/pg-type-parsers';
import { registerSequelizeCls } from './helpers/sequelize-namespace/sequelize-namespace';

registerPgTypeParsers();
registerSequelizeCls();

async function bootstrap() {
  await repl(AppModule);
}
bootstrap().catch((err) => {
  console.error(err);
});
