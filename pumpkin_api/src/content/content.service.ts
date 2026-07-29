import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CacheResult, ContentCacheService } from '../cache/content-cache.service';
import { Env } from '../config/env.validation';
import { StrapiService } from '../strapi/strapi.service';

/**
 * The four Strapi calls the Angular frontend makes, each behind the cache.
 *
 * Response bodies are passed through untouched — this service must stay a
 * drop-in replacement for the direct Strapi proxy in the SSR server, so any
 * reshaping here would be a breaking change for the frontend.
 */
@Injectable()
export class ContentService {
  private readonly contentTtlMs: number;
  private readonly navigationTtlMs: number;

  constructor(
    private readonly strapi: StrapiService,
    private readonly cache: ContentCacheService,
    config: ConfigService<Env, true>,
  ) {
    this.contentTtlMs = config.get('CACHE_TTL_MS', { infer: true });
    this.navigationTtlMs = config.get('CACHE_NAVIGATION_TTL_MS', { infer: true });
  }

  getPage(path: string): Promise<CacheResult<unknown>> {
    return this.cache.wrap(`page:${path}`, this.contentTtlMs, () =>
      this.strapi.get(`/api/page-by-path?path=${encodeURIComponent(path)}`),
    );
  }

  getHeader(): Promise<CacheResult<unknown>> {
    return this.cache.wrap('head', this.contentTtlMs, () => this.strapi.get('/api/head'));
  }

  getFooter(): Promise<CacheResult<unknown>> {
    return this.cache.wrap('foot', this.contentTtlMs, () => this.strapi.get('/api/foot'));
  }

  /**
   * Navigation gets its own, shorter TTL: the navigation plugin manages its
   * entries outside the normal content-type lifecycle, so a publish there does
   * not reliably trigger the invalidation webhook.
   */
  getNavigation(menu: string, type: string): Promise<CacheResult<unknown>> {
    return this.cache.wrap(`navigation:${menu}:${type}`, this.navigationTtlMs, () =>
      this.strapi.get(
        `/api/navigation/render/${encodeURIComponent(menu)}?type=${encodeURIComponent(type)}`,
      ),
    );
  }
}
