/**
 * Runs before the test file is loaded.
 *
 * `ConfigModule.forRoot()` validates the environment while `app.module.ts` is
 * being imported, so setting these in a `beforeAll` would already be too late.
 */
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.BASE_PATH_STRAPI = 'http://strapi.invalid:6466';
process.env.STRAPI_API_TOKEN = 'test-token';
process.env.STRAPI_WEBHOOK_SECRET = 'test-secret-value-1234';
process.env.CACHE_TTL_MS = '60000';
process.env.CACHE_NAVIGATION_TTL_MS = '60000';
process.env.CACHE_STALE_TTL_MS = '3600000';
