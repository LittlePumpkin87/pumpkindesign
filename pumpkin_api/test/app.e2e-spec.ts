import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { StrapiUnavailableError } from '../src/strapi/strapi-unavailable.error';
import { StrapiService } from '../src/strapi/strapi.service';

const WEBHOOK_SECRET = process.env.STRAPI_WEBHOOK_SECRET as string;

describe('pumpkin-api (e2e)', () => {
  let app: INestApplication;
  let strapi: { get: jest.Mock; ping: jest.Mock };

  beforeEach(async () => {
    strapi = {
      get: jest.fn().mockResolvedValue({ data: { title: 'Startseite' } }),
      ping: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(StrapiService)
      .useValue(strapi)
      .compile();

    app = configureApp(moduleRef.createNestApplication());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('content routes', () => {
    it.each(['/api/head', '/api/foot', '/api/page-by-path?path=/'])(
      'serves %s and reports the cache status',
      async (url) => {
        const first = await request(app.getHttpServer()).get(url).expect(200);
        const second = await request(app.getHttpServer()).get(url).expect(200);

        expect(first.headers['x-cache']).toBe('MISS');
        expect(second.headers['x-cache']).toBe('HIT');
        expect(second.body).toEqual({ data: { title: 'Startseite' } });
        expect(strapi.get).toHaveBeenCalledTimes(1);
      },
    );

    it('serves the navigation tree', async () => {
      await request(app.getHttpServer())
        .get('/api/navigation/render/main?type=TREE')
        .expect(200)
        .expect('X-Cache', 'MISS');

      expect(strapi.get).toHaveBeenCalledWith('/api/navigation/render/main?type=TREE');
    });

    it('rejects a page-by-path request without a path', async () => {
      await request(app.getHttpServer()).get('/api/page-by-path').expect(400);
      expect(strapi.get).not.toHaveBeenCalled();
    });

    it.each(['../../etc/passwd', '/kontakt?x=1', 'kontakt\\x'])(
      'rejects the malformed path %p',
      async (path) => {
        await request(app.getHttpServer())
          .get(`/api/page-by-path?path=${encodeURIComponent(path)}`)
          .expect(400);
        expect(strapi.get).not.toHaveBeenCalled();
      },
    );

    // The frontend sends "/" for the start page and slug-only paths for every
    // subpage (PageService.getApiPathFromUrl). Strapi matches with $eq, so both
    // forms have to pass validation and reach it unchanged.
    it.each([
      ['/', '/api/page-by-path?path=%2F'],
      ['impressum', '/api/page-by-path?path=impressum'],
      ['blog/artikel', '/api/page-by-path?path=blog%2Fartikel'],
    ])('forwards the path %p exactly as the frontend sends it', async (path, expected) => {
      await request(app.getHttpServer())
        .get(`/api/page-by-path?path=${encodeURIComponent(path)}`)
        .expect(200);

      expect(strapi.get).toHaveBeenCalledWith(expected);
    });

    it('accepts a path with umlauts', async () => {
      await request(app.getHttpServer())
        .get(`/api/page-by-path?path=${encodeURIComponent('/über-mich')}`)
        .expect(200);

      expect(strapi.get).toHaveBeenCalledWith('/api/page-by-path?path=%2F%C3%BCber-mich');
    });
  });

  describe('resilience', () => {
    it('serves stale content when Strapi becomes unavailable', async () => {
      await request(app.getHttpServer()).get('/api/head').expect(200);

      strapi.get.mockRejectedValue(new StrapiUnavailableError('connect ECONNREFUSED'));
      // Wait out the fresh window so the next request has to go upstream.
      // The target time must be read before the spy replaces Date.now.
      const afterTtl = Date.now() + 61_000;
      jest.spyOn(Date, 'now').mockReturnValue(afterTtl);

      const stale = await request(app.getHttpServer()).get('/api/head').expect(200);

      expect(stale.headers['x-cache']).toBe('STALE');
      expect(stale.body).toEqual({ data: { title: 'Startseite' } });
      jest.restoreAllMocks();
    });
  });

  describe('cache invalidation', () => {
    it('rejects a webhook without the shared secret', async () => {
      // Also proves the wildcard passthrough does not shadow this route.
      await request(app.getHttpServer())
        .post('/api/cache/invalidate')
        .send({ event: 'entry.publish' })
        .expect(401);
    });

    it('rejects a webhook with the wrong secret', async () => {
      await request(app.getHttpServer())
        .post('/api/cache/invalidate')
        .set('X-Webhook-Secret', 'wrong')
        .send({ event: 'entry.publish' })
        .expect(401);
    });

    it('flushes the cache so the next request goes upstream again', async () => {
      await request(app.getHttpServer()).get('/api/head').expect('X-Cache', 'MISS');
      await request(app.getHttpServer()).get('/api/head').expect('X-Cache', 'HIT');

      const response = await request(app.getHttpServer())
        .post('/api/cache/invalidate')
        .set('X-Webhook-Secret', WEBHOOK_SECRET)
        .send({ event: 'entry.publish', model: 'page' })
        .expect(200);

      expect(response.body).toEqual({ invalidated: 1 });
      await request(app.getHttpServer()).get('/api/head').expect('X-Cache', 'MISS');
      expect(strapi.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('published content only', () => {
    // A read-only Strapi API token may read drafts. Since the passthrough
    // forwards raw query strings, unpublished work would otherwise be one
    // query parameter away from being public.
    it.each([
      '/api/pages?status=draft',
      '/api/pages?publicationState=preview',
      '/api/pages?status[0]=draft',
      '/api/pages?status=published&status=draft',
      '/api/page-by-path?path=/&status=draft',
    ])('refuses %s', async (url) => {
      await request(app.getHttpServer()).get(url).expect(403);
      expect(strapi.get).not.toHaveBeenCalled();
    });

    it.each(['/api/pages', '/api/pages?status=published', '/api/pages?publicationState=live'])(
      'allows %s',
      async (url) => {
        await request(app.getHttpServer()).get(url).expect(200);
        expect(strapi.get).toHaveBeenCalled();
      },
    );
  });

  describe('passthrough', () => {
    it('forwards an unmapped GET uncached', async () => {
      await request(app.getHttpServer())
        .get('/api/skills?populate=*')
        .expect(200)
        .expect('X-Cache', 'BYPASS');

      expect(strapi.get).toHaveBeenCalledWith('/api/skills?populate=*');
    });

    it('refuses a write instead of forwarding it without its body', async () => {
      await request(app.getHttpServer()).post('/api/skills').send({ name: 'x' }).expect(405);
      expect(strapi.get).not.toHaveBeenCalled();
    });
  });

  describe('operations endpoints', () => {
    it('reports liveness without touching Strapi', async () => {
      const response = await request(app.getHttpServer()).get('/health').expect(200);

      expect(response.body.status).toBe('ok');
      expect(strapi.ping).not.toHaveBeenCalled();
    });

    it('reports the Strapi dependency separately', async () => {
      await request(app.getHttpServer()).get('/health/strapi').expect(200);
      expect(strapi.ping).toHaveBeenCalled();
    });

    it('returns 503 from the dependency check when Strapi is down', async () => {
      strapi.ping.mockRejectedValue(new StrapiUnavailableError('down'));

      await request(app.getHttpServer()).get('/health/strapi').expect(503);
    });

    it('exposes cache metrics', async () => {
      await request(app.getHttpServer()).get('/api/head').expect(200);
      await request(app.getHttpServer()).get('/api/head').expect(200);

      const response = await request(app.getHttpServer()).get('/metrics').expect(200);

      expect(response.body.cache).toMatchObject({ hits: 1, misses: 1, entries: 1, hitRate: 0.5 });
      expect(response.body.process.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });
  });
});
