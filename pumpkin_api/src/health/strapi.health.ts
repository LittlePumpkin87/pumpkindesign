import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';

import { StrapiService } from '../strapi/strapi.service';

@Injectable()
export class StrapiHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly strapi: StrapiService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const start = Date.now();

    try {
      await this.strapi.ping();
      return indicator.up({ responseTimeMs: Date.now() - start });
    } catch (error) {
      return indicator.down({
        responseTimeMs: Date.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
