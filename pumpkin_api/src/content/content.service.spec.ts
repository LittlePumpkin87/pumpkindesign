import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { ContentCacheService } from '../cache/content-cache.service';
import { StrapiService } from '../strapi/strapi.service';
import { ContentService } from './content.service';

const CONTENT_TTL_MS = 3_600_000;
const NAVIGATION_TTL_MS = 300_000;
const STALE_TTL_MS = 86_400_000;

const config = {
  get: (key: string) =>
    ({
      CACHE_TTL_MS: CONTENT_TTL_MS,
      CACHE_NAVIGATION_TTL_MS: NAVIGATION_TTL_MS,
      CACHE_STALE_TTL_MS: STALE_TTL_MS,
    })[key],
};

describe('ContentService', () => {
  let content: ContentService;
  let cache: ContentCacheService;
  let strapi: { get: jest.Mock };

  beforeEach(async () => {
    strapi = { get: jest.fn().mockResolvedValue({ ok: true }) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ContentService,
        ContentCacheService,
        { provide: StrapiService, useValue: strapi },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    content = moduleRef.get(ContentService);
    cache = moduleRef.get(ContentCacheService);
  });

  it('requests the Strapi routes the frontend expects', async () => {
    await content.getHeader();
    await content.getFooter();
    await content.getPage('/');
    await content.getNavigation('main', 'TREE');

    expect(strapi.get.mock.calls.map(([url]) => url)).toEqual([
      '/api/head',
      '/api/foot',
      '/api/page-by-path?path=%2F',
      '/api/navigation/render/main?type=TREE',
    ]);
  });

  it('encodes the page path instead of interpolating it raw', async () => {
    await content.getPage('/über mich&x=1');

    expect(strapi.get).toHaveBeenCalledWith('/api/page-by-path?path=%2F%C3%BCber%20mich%26x%3D1');
  });

  it('passes the Strapi response through unchanged', async () => {
    const payload = { data: { title: 'Startseite' }, meta: {} };
    strapi.get.mockResolvedValue(payload);

    const result = await content.getPage('/');

    expect(result.data).toBe(payload);
  });

  it('caches pages per path', async () => {
    await content.getPage('/');
    await content.getPage('/');
    await content.getPage('/kontakt');

    expect(strapi.get).toHaveBeenCalledTimes(2);
  });

  it('gives navigation a shorter TTL than page content', async () => {
    const wrap = jest.spyOn(cache, 'wrap');

    await content.getPage('/');
    await content.getNavigation('main', 'TREE');

    expect(wrap).toHaveBeenNthCalledWith(1, 'page:/', CONTENT_TTL_MS, expect.any(Function));
    expect(wrap).toHaveBeenNthCalledWith(
      2,
      'navigation:main:TREE',
      NAVIGATION_TTL_MS,
      expect.any(Function),
    );
  });
});
