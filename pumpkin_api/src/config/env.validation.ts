import { z } from 'zod';

/**
 * Every value the service needs, validated once at boot.
 *
 * The service fails to start on invalid configuration instead of failing on the
 * first request. A missing STRAPI_API_TOKEN in production would otherwise only
 * surface as a stream of 403s from Strapi.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  /** Base URL of the Strapi instance, e.g. http://strapi:6466 — same name the SSR server uses. */
  BASE_PATH_STRAPI: z.url(),
  STRAPI_API_TOKEN: z.string().min(1, 'STRAPI_API_TOKEN must not be empty'),

  /** Shared secret Strapi sends as X-Webhook-Secret when invalidating the cache. */
  STRAPI_WEBHOOK_SECRET: z.string().min(16, 'STRAPI_WEBHOOK_SECRET must be at least 16 characters'),

  /**
   * Allows `?status=draft` / `?publicationState=preview` to reach Strapi.
   * Off by default — production must only ever serve published content.
   *
   * Not `z.coerce.boolean()`: that turns the string "false" into `true`, which
   * would silently open exactly the door this flag is meant to keep shut.
   */
  ALLOW_DRAFT_ACCESS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  STRAPI_TIMEOUT_MS: z.coerce.number().int().positive().default(8_000),
  /** Retries *in addition* to the first attempt, only for 5xx/network/timeout. */
  STRAPI_RETRIES: z.coerce.number().int().min(0).max(5).default(1),

  /**
   * Fresh window. Long on purpose: invalidation is push-based (Strapi webhook),
   * so content does not need to expire to stay current.
   */
  CACHE_TTL_MS: z.coerce.number().int().min(0).default(3_600_000),
  /**
   * How long an expired entry may still be served when Strapi is unreachable.
   * This is the outage buffer, not a freshness window.
   */
  CACHE_STALE_TTL_MS: z.coerce.number().int().min(0).default(86_400_000),
  /**
   * The navigation plugin does not reliably emit entry.* webhooks, so the
   * navigation tree falls back to a short TTL instead of relying on invalidation.
   */
  CACHE_NAVIGATION_TTL_MS: z.coerce.number().int().min(0).default(300_000),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return result.data;
}
