import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { Env } from './config/env.validation';

async function bootstrap(): Promise<void> {
  const app = configureApp(await NestFactory.create(AppModule));
  app.enableShutdownHooks();

  const config = app.get(ConfigService<Env, true>);
  const port = config.get('PORT', { infer: true });

  await app.listen(port, '0.0.0.0');
  Logger.log(`pumpkin-api listening on http://0.0.0.0:${port}`, 'Bootstrap');
}

void bootstrap();
