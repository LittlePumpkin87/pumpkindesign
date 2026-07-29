import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { StrapiUnavailableError } from '../strapi/strapi-unavailable.error';
import { ContentCacheService } from './content-cache.service';

const STALE_TTL_MS = 86_400_000;

describe('ContentCacheService', () => {
  let cache: ContentCacheService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ContentCacheService,
        { provide: ConfigService, useValue: { get: () => STALE_TTL_MS } },
      ],
    }).compile();

    cache = moduleRef.get(ContentCacheService);
  });

  describe('TTL', () => {
    it('reports MISS on the first call and HIT while fresh', async () => {
      const loader = jest.fn().mockResolvedValue({ title: 'Startseite' });

      const first = await cache.wrap('page:/', 60_000, loader);
      const second = await cache.wrap('page:/', 60_000, loader);

      expect(first).toEqual({ data: { title: 'Startseite' }, status: 'MISS' });
      expect(second).toEqual({ data: { title: 'Startseite' }, status: 'HIT' });
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it('refetches once the entry is no longer fresh', async () => {
      const loader = jest.fn().mockResolvedValueOnce('old').mockResolvedValueOnce('new');

      await cache.wrap('head', 0, loader);
      const second = await cache.wrap('head', 0, loader);

      expect(second).toEqual({ data: 'new', status: 'MISS' });
      expect(loader).toHaveBeenCalledTimes(2);
    });
  });

  describe('single-flight', () => {
    it('collapses concurrent misses on the same key into one upstream call', async () => {
      let resolveLoader: (value: string) => void = () => undefined;
      const loader = jest.fn(
        () =>
          new Promise<string>((resolve) => {
            resolveLoader = resolve;
          }),
      );

      const pending = Promise.all([
        cache.wrap('foot', 60_000, loader),
        cache.wrap('foot', 60_000, loader),
        cache.wrap('foot', 60_000, loader),
      ]);
      resolveLoader('footer');
      const results = await pending;

      expect(loader).toHaveBeenCalledTimes(1);
      expect(results.map((result) => result.data)).toEqual(['footer', 'footer', 'footer']);
      expect(cache.getStats().upstreamFetches).toBe(1);
    });

    it('keeps different keys independent', async () => {
      const loader = jest.fn().mockResolvedValue('x');

      await Promise.all([cache.wrap('head', 60_000, loader), cache.wrap('foot', 60_000, loader)]);

      expect(loader).toHaveBeenCalledTimes(2);
    });

    it('propagates a failure to every joined caller and does not cache it', async () => {
      const loader = jest
        .fn()
        .mockRejectedValueOnce(new StrapiUnavailableError('down'))
        .mockResolvedValueOnce('recovered');

      await expect(
        Promise.all([cache.wrap('head', 60_000, loader), cache.wrap('head', 60_000, loader)]),
      ).rejects.toThrow(StrapiUnavailableError);

      await expect(cache.wrap('head', 60_000, loader)).resolves.toEqual({
        data: 'recovered',
        status: 'MISS',
      });
    });
  });

  describe('stale-if-error', () => {
    it('serves an expired entry while Strapi is unavailable', async () => {
      const loader = jest
        .fn()
        .mockResolvedValueOnce('cached page')
        .mockRejectedValue(new StrapiUnavailableError('connect ECONNREFUSED'));

      await cache.wrap('page:/', 0, loader);
      const result = await cache.wrap('page:/', 0, loader);

      expect(result).toEqual({ data: 'cached page', status: 'STALE' });
      expect(cache.getStats().staleServes).toBe(1);
    });

    it('does not mask a 4xx with stale data', async () => {
      const loader = jest
        .fn()
        .mockResolvedValueOnce('cached page')
        .mockRejectedValue(new HttpException({ error: 'Not Found' }, 404));

      await cache.wrap('page:/gone', 0, loader);

      await expect(cache.wrap('page:/gone', 0, loader)).rejects.toThrow(HttpException);
    });

    it('rethrows when nothing is cached to fall back to', async () => {
      const loader = jest.fn().mockRejectedValue(new StrapiUnavailableError('down'));

      await expect(cache.wrap('page:/', 60_000, loader)).rejects.toThrow(StrapiUnavailableError);
    });

    it('stops serving stale once the stale window has passed', async () => {
      const moduleRef = await Test.createTestingModule({
        providers: [ContentCacheService, { provide: ConfigService, useValue: { get: () => 0 } }],
      }).compile();
      const shortLived = moduleRef.get(ContentCacheService);
      const loader = jest
        .fn()
        .mockResolvedValueOnce('cached')
        .mockRejectedValue(new StrapiUnavailableError('down'));

      await shortLived.wrap('head', 0, loader);

      await expect(shortLived.wrap('head', 0, loader)).rejects.toThrow(StrapiUnavailableError);
    });
  });

  describe('invalidation', () => {
    it('drops all entries and reports how many', async () => {
      const loader = jest.fn().mockResolvedValue('value');
      await cache.wrap('head', 60_000, loader);
      await cache.wrap('foot', 60_000, loader);

      expect(cache.invalidateAll()).toBe(2);

      await cache.wrap('head', 60_000, loader);
      expect(loader).toHaveBeenCalledTimes(3);
    });
  });

  describe('stats', () => {
    it('tracks the hit rate over lookups', async () => {
      const loader = jest.fn().mockResolvedValue('value');

      await cache.wrap('head', 60_000, loader); // MISS
      await cache.wrap('head', 60_000, loader); // HIT
      await cache.wrap('head', 60_000, loader); // HIT

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.6667, 3);
      expect(stats.entries).toBe(1);
    });

    it('starts at a zero hit rate rather than NaN', () => {
      expect(cache.getStats().hitRate).toBe(0);
    });
  });
});
