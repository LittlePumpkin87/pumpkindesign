import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import { CacheModule } from './cache/cache.module';
import { PublishedOnlyGuard } from './common/published-only.guard';
import { validateEnv } from './config/env.validation';
import { ContentModule } from './content/content.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { PassthroughModule } from './passthrough/passthrough.module';
import { StrapiModule } from './strapi/strapi.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      // Only this project's own .env — the repository root .env belongs to
      // Strapi and its PORT would collide when running outside Docker.
      envFilePath: '.env',
    }),
    // Configured here but applied per-route, not globally: in production every
    // request arrives from a single client (the Angular SSR container), so a
    // global per-IP limit would throttle the entire site during a traffic spike.
    // Only the webhook endpoint uses ThrottlerGuard.
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 60 }],
    }),
    StrapiModule,
    CacheModule,
    ContentModule,
    HealthModule,
    MetricsModule,
    // Must stay last: PassthroughController's `*splat` wildcard matches
    // everything and would shadow the routes above if registered earlier.
    PassthroughModule,
  ],
  providers: [
    // Global on purpose: the passthrough forwards raw query strings, so the
    // draft rule has to hold for every route, including ones added later.
    { provide: APP_GUARD, useClass: PublishedOnlyGuard },
  ],
})
export class AppModule {}
