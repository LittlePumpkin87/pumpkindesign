import { Body, Controller, HttpCode, HttpStatus, Logger, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { ContentCacheService } from './content-cache.service';
import { StrapiWebhookDto } from './dto/strapi-webhook.dto';
import { WebhookSecretGuard } from './webhook-secret.guard';

@Controller('cache')
export class CacheController {
  private readonly logger = new Logger(CacheController.name);

  constructor(private readonly cache: ContentCacheService) {}

  /**
   * Push invalidation endpoint, called by Strapi on entry.publish / entry.unpublish /
   * entry.update / entry.delete (Settings → Webhooks).
   *
   * Strategy is a full flush rather than per-model invalidation. `getAutoPopulate()`
   * in the Strapi router controller resolves relations up to depth 8, so a change to
   * a single shared component can affect any page — a targeted invalidation would be
   * guesswork. With a few dozen entries the flush costs one upstream fetch per key
   * that is actually requested again.
   *
   * Throttled ahead of the secret check so a brute-force attempt is rate limited.
   */
  @Post('invalidate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard, WebhookSecretGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  invalidate(@Body() payload: StrapiWebhookDto): { invalidated: number } {
    this.logger.log(
      `Invalidation received (event=${payload.event ?? 'manual'}, model=${payload.model ?? '-'})`,
    );
    return { invalidated: this.cache.invalidateAll() };
  }
}
