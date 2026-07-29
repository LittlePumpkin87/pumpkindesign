import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Env } from '../config/env.validation';
import { StrapiUnavailableError } from '../strapi/strapi-unavailable.error';

export type CacheStatus = 'HIT' | 'MISS' | 'STALE';

export interface CacheResult<T> {
  data: T;
  status: CacheStatus;
}

export interface CacheStats {
  hits: number;
  misses: number;
  staleServes: number;
  upstreamFetches: number;
  invalidations: number;
  entries: number;
  inFlight: number;
  hitRate: number;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  staleUntil: number;
}

/**
 * In-memory content cache with three properties that matter for this site:
 *
 * 1. TTL — entries are fresh until `expiresAt`.
 * 2. stale-if-error — an expired entry is still served while Strapi is down,
 *    up to `staleUntil`. Without this, a Strapi restart takes the site with it.
 * 3. Single-flight — concurrent misses on the same key share one upstream
 *    request. `/page-by-path` runs a recursive deep-populate query in Strapi,
 *    so a burst of N cold requests must not become N of those queries.
 *
 * A Map is enough here: the whole site is a few dozen content objects, the
 * process is single-instance, and a cold start costs one upstream fetch per key.
 * Redis would add an operational dependency for no gain at this size.
 */
@Injectable()
export class ContentCacheService {
  private readonly logger = new Logger(ContentCacheService.name);
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly staleTtlMs: number;

  private hits = 0;
  private misses = 0;
  private staleServes = 0;
  private upstreamFetches = 0;
  private invalidations = 0;

  constructor(config: ConfigService<Env, true>) {
    this.staleTtlMs = config.get('CACHE_STALE_TTL_MS', { infer: true });
  }

  async wrap<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<CacheResult<T>> {
    const now = Date.now();
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (entry && now < entry.expiresAt) {
      this.hits++;
      return { data: entry.data, status: 'HIT' };
    }

    try {
      const data = await this.load(key, ttlMs, loader);
      this.misses++;
      return { data, status: 'MISS' };
    } catch (error) {
      // Only unavailability justifies stale data. A 4xx is a real answer and
      // must not be masked by whatever happened to be cached before.
      if (error instanceof StrapiUnavailableError && entry && now < entry.staleUntil) {
        this.staleServes++;
        this.logger.warn(`Serving stale entry for "${key}" — Strapi unavailable: ${error.message}`);
        return { data: entry.data, status: 'STALE' };
      }
      throw error;
    }
  }

  /** Drops every entry. Returns how many were removed. */
  invalidateAll(): number {
    const removed = this.store.size;
    this.store.clear();
    this.invalidations++;
    this.logger.log(`Cache invalidated — ${removed} entr${removed === 1 ? 'y' : 'ies'} dropped`);
    return removed;
  }

  getStats(): CacheStats {
    const lookups = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      staleServes: this.staleServes,
      upstreamFetches: this.upstreamFetches,
      invalidations: this.invalidations,
      entries: this.store.size,
      inFlight: this.inFlight.size,
      hitRate: lookups === 0 ? 0 : Number((this.hits / lookups).toFixed(4)),
    };
  }

  /**
   * Runs the loader unless an identical request is already in flight, in which
   * case the caller joins that one. Both success and failure are shared.
   */
  private load<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }

    this.upstreamFetches++;
    const promise = loader()
      .then((data) => {
        const now = Date.now();
        this.store.set(key, {
          data,
          expiresAt: now + ttlMs,
          staleUntil: now + this.staleTtlMs,
        });
        return data;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    // The real callers await `promise` and handle rejection; this only stops Node
    // from reporting an unhandled rejection in the window before they attach.
    promise.catch(() => undefined);

    return promise;
  }
}
