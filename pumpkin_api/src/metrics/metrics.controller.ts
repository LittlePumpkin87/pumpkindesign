import { Controller, Get } from '@nestjs/common';

import { CacheStats, ContentCacheService } from '../cache/content-cache.service';

interface Metrics {
  cache: CacheStats;
  process: {
    uptimeSeconds: number;
    heapUsedMb: number;
    rssMb: number;
  };
}

@Controller('metrics')
export class MetricsController {
  constructor(private readonly cache: ContentCacheService) {}

  /**
   * Plain JSON rather than a Prometheus exposition format — there is no scraper
   * on the NAS, and these numbers are read by hand.
   */
  @Get()
  metrics(): Metrics {
    const memory = process.memoryUsage();
    return {
      cache: this.cache.getStats(),
      process: {
        uptimeSeconds: Math.round(process.uptime()),
        heapUsedMb: Number((memory.heapUsed / 1024 / 1024).toFixed(1)),
        rssMb: Number((memory.rss / 1024 / 1024).toFixed(1)),
      },
    };
  }
}
