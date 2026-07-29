import { Module } from '@nestjs/common';

import { CacheModule } from '../cache/cache.module';
import { MetricsController } from './metrics.controller';

@Module({
  imports: [CacheModule],
  controllers: [MetricsController],
})
export class MetricsModule {}
