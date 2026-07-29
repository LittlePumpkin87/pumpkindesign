import { Module } from '@nestjs/common';

import { CacheController } from './cache.controller';
import { ContentCacheService } from './content-cache.service';
import { WebhookSecretGuard } from './webhook-secret.guard';

@Module({
  controllers: [CacheController],
  providers: [ContentCacheService, WebhookSecretGuard],
  exports: [ContentCacheService],
})
export class CacheModule {}
