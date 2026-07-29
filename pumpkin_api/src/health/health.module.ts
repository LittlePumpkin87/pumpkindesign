import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { StrapiModule } from '../strapi/strapi.module';
import { HealthController } from './health.controller';
import { StrapiHealthIndicator } from './strapi.health';

@Module({
  imports: [TerminusModule, StrapiModule],
  controllers: [HealthController],
  providers: [StrapiHealthIndicator],
})
export class HealthModule {}
