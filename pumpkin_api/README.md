# pumpkin-api

Content delivery service for [littlepumpkindesign.de](https://littlepumpkindesign.de).
NestJS 11, TypeScript, no external cache infrastructure.

It sits between the Angular SSR server and Strapi and does three things the
previous direct proxy could not: cache content, keep it correct through push
invalidation, and keep the site up when Strapi is not.

> **[docs/ARCHITEKTUR.md](docs/ARCHITEKTUR.md)** (in German) covers the same ground
> in depth: how each mechanism works, which alternatives were rejected and why,
> and where the limits of this design are.

```
Browser ──> nginx ──> angular_prod (SSR)
                        │  static assets, sitemap.xml, CSP nonce
                        └─ /api ──> pumpkin_api  ← this service
                                      │  cache, invalidation, resilience
                                      └──> strapi ──> postgres
```

## Why it exists

The site is read-only content delivery, and every page render used to make four
uncached calls into Strapi. One of them, `/page-by-path`, runs `getAutoPopulate()` —
a recursive populate tree up to depth 8 — against Postgres on every request. A
Strapi restart took the whole site down with it.

## Design decisions

**Drop-in on purpose.** The routes mirror Strapi's paths exactly and response
bodies are passed through untouched, so switching the SSR server over is one
environment variable (`BASE_PATH_STRAPI`) and no frontend change. Rollback is the
same variable.

**A `Map`, not Redis.** The whole site is a few dozen content objects in a
single-instance process. Redis would add a container, a failure mode and a backup
concern to cache 20 MB of JSON.

**Push invalidation, not short TTLs.** Strapi calls `POST /api/cache/invalidate`
on publish, so the fresh window can be an hour without editors ever waiting for
their changes. The exception is the navigation tree: the navigation plugin does
not reliably emit `entry.*` webhooks, so it falls back to a 5-minute TTL.

**Full flush, not tagged invalidation.** With deep populate, a change to one
shared component can affect any page — targeted invalidation would be guesswork.
The flush is O(1) and always correct.

**stale-if-error.** When Strapi is unreachable, expired entries are served for up
to 24 hours with `X-Cache: STALE`. This is why `/health` is liveness-only: if it
reported Strapi's state, Docker would restart this container during an outage and
wipe exactly the cache that was covering it.

**Single-flight.** Concurrent misses on the same key share one upstream request,
so a burst of cold traffic cannot turn into N deep-populate queries.

**Rate limiting only on the webhook.** In production all traffic arrives from one
IP — the SSR container — so a global per-IP limit would throttle the entire site.

## Endpoints

| Method | Path | Cached | Notes |
| --- | --- | --- | --- |
| GET | `/api/page-by-path?path=…` | yes | `path` is validated and re-encoded |
| GET | `/api/head` | yes | |
| GET | `/api/foot` | yes | |
| GET | `/api/navigation/render/:menu?type=TREE` | yes | shorter TTL |
| GET | `/api/*` | no | passthrough for unmapped routes, `X-Cache: BYPASS` |
| POST | `/api/cache/invalidate` | — | requires `X-Webhook-Secret`, throttled |
| GET | `/health` | — | liveness, used by the Docker healthcheck |
| GET | `/health/strapi` | — | dependency check, 503 when Strapi is down |
| GET | `/metrics` | — | cache hit rate, upstream fetches, memory |

Every cached response carries `X-Cache: HIT | MISS | STALE`.

A global guard refuses any request asking for unpublished content
(`?status=draft`, `?publicationState=preview`) with **403**. Strapi serves
published entries by default, so only the explicit request is blocked — see
`PublishedOnlyGuard`.

## Configuration

Validated at boot by `src/config/env.validation.ts` — the service refuses to
start on an invalid configuration rather than failing on the first request.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `BASE_PATH_STRAPI` | yes | — | Strapi base URL |
| `STRAPI_API_TOKEN` | yes | — | Strapi API token |
| `STRAPI_WEBHOOK_SECRET` | yes | — | shared secret, min. 16 chars |
| `ALLOW_DRAFT_ACCESS` | no | `false` | `true` lets `?status=draft` through — never in production |
| `PORT` | no | `3000` | |
| `CACHE_TTL_MS` | no | `3600000` | fresh window |
| `CACHE_NAVIGATION_TTL_MS` | no | `300000` | fresh window for navigation |
| `CACHE_STALE_TTL_MS` | no | `86400000` | outage buffer |
| `STRAPI_TIMEOUT_MS` | no | `8000` | |
| `STRAPI_RETRIES` | no | `1` | extra attempts on 5xx/network |

## Development

```bash
npm install
npm run start:dev
npm test          # unit
npm run test:e2e  # e2e, Strapi stubbed
```

Or as part of the stack: `docker compose -f ../docker-compose.dev.yml up`.

## Strapi webhook setup

In the Strapi admin under **Settings → Webhooks**, create one webhook:

- URL: `http://pumpkin_api:3000/api/cache/invalidate`
- Header: `X-Webhook-Secret` = the value of `STRAPI_WEBHOOK_SECRET`
- Events: `entry.publish`, `entry.unpublish`, `entry.update`, `entry.delete`

Without it the cache still self-heals through the TTL, just an hour later.
