import { INestApplication, ValidationPipe } from '@nestjs/common';

import { LoggingInterceptor } from './common/logging.interceptor';

/**
 * Global wiring shared by the real server and the e2e tests, so the two cannot
 * drift apart — a route that only works because of a prefix the tests do not
 * apply is exactly the kind of bug e2e tests are supposed to catch.
 */
export function configureApp(app: INestApplication): INestApplication {
  // Express 5 parses query strings with the "simple" parser by default, Strapi
  // uses qs in extended mode. That difference is exploitable: `?status[0]=draft`
  // is a literal key named "status[0]" to Express — invisible to
  // PublishedOnlyGuard — but `status: ['draft']` to Strapi, which would then
  // serve the draft. A guard must see the request the same way its downstream
  // does, so both parsers are aligned here.
  app.getHttpAdapter().getInstance().set('query parser', 'extended');

  // Content routes live under /api so the SSR server can point BASE_PATH_STRAPI
  // here unchanged. Health and metrics stay outside the prefix — they are
  // operational endpoints, not part of the Strapi-compatible surface.
  app.setGlobalPrefix('api', { exclude: ['health', 'health/strapi', 'metrics'] });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalInterceptors(new LoggingInterceptor());

  return app;
}
