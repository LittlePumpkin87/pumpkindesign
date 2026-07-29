import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckResult, HealthCheckService } from '@nestjs/terminus';

import { StrapiHealthIndicator } from './strapi.health';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly strapi: StrapiHealthIndicator,
  ) {}

  /**
   * Liveness only — this is what the Docker HEALTHCHECK uses.
   *
   * It deliberately does *not* check Strapi. If it did, a Strapi outage would
   * mark this container unhealthy, Docker would restart it, and the restart
   * would wipe the in-memory cache — destroying the stale entries that are the
   * whole point of surviving that outage.
   */
  @Get()
  live(): { status: string; uptimeSeconds: number } {
    return { status: 'ok', uptimeSeconds: Math.round(process.uptime()) };
  }

  /**
   * Dependency check for humans and monitoring. Returns 503 when Strapi is
   * unreachable, which is information, not a reason to restart anything.
   */
  @Get('strapi')
  @HealthCheck()
  checkStrapi(): Promise<HealthCheckResult> {
    return this.health.check([() => this.strapi.isHealthy('strapi')]);
  }
}
