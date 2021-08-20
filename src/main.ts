import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SystemConfig } from './environment/interfaces/environment-types.interface';
import {
  INestApplication,
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ClusterModule } from './cluster/cluster.module';
import { SetupClusterService } from './cluster/services/setup-cluster/setup-cluster.service';
import { useContainer } from 'class-validator';
import { ContextInterceptor } from './helpers/interceptors/context/context.interceptor';
import { NotFoundConverterInterceptor } from './helpers/interceptors/not-found-converter/not-found-converter.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ErrorValidationFormatFilter } from './helpers/filters/error-validation-format/error-validation-format.filter';
import { LoggingService } from './services/logging/logging.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get<LoggingService>(LoggingService));

  const config = app.get(ConfigService);
  app.enableCors();

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      exceptionFactory(errors: ValidationError[]) {
        return new UnprocessableEntityException(
          errors,
          'The given data was invalid.',
        );
      },
    }),
  );
  app.useGlobalInterceptors(
    app.get(NotFoundConverterInterceptor),
    new ContextInterceptor(),
  );

  app.useGlobalFilters(new ErrorValidationFormatFilter());
  setupApiDocumentation(app);

  await app.listen(config.get<SystemConfig>('system').port);
}

/**
 * Start cluster to handle main application
 */
async function clusterStart() {
  const app = await NestFactory.create(ClusterModule);
  const clusterService = app.get(SetupClusterService);
  clusterService.start(bootstrap);
  return app;
}

/**
 * Setup documentation builder
 * @param app
 */
function setupApiDocumentation(app: INestApplication) {
  const options = new DocumentBuilder()
    .setTitle('Api for {CHANGE TEMPLATE NAME}')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-documentation/v1', app, document);
}

clusterStart().then((app) => {
  const clusterService = app.get(SetupClusterService);
  clusterService.closeEvent.asObservable().subscribe(() => process.exit());
});
