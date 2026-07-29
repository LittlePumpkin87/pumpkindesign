import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { Env } from '../config/env.validation';

/**
 * Refuses any request that explicitly asks for unpublished content.
 *
 * Strapi serves published entries by default; drafts require an explicit
 * `?status=draft` (Strapi 5) or `?publicationState=preview` (Strapi 4). An API
 * token of type "read-only" is allowed to read drafts, so with the passthrough
 * route in place `GET /api/pages?status=draft` would expose unpublished work to
 * anyone on the internet. Rather than relying on how a token happens to be
 * scoped in the Strapi admin, the rule is enforced here, in code, with a test.
 *
 * Refusing the explicit request is enough — and is preferable to rewriting the
 * query, which would mean appending `status=published` to plugin routes that do
 * not understand the parameter.
 *
 * Registered as a global guard so a future route that forwards query parameters
 * is covered without anyone having to remember this file.
 */
@Injectable()
export class PublishedOnlyGuard implements CanActivate {
  private readonly allowDrafts: boolean;

  constructor(config: ConfigService<Env, true>) {
    this.allowDrafts = config.get('ALLOW_DRAFT_ACCESS', { infer: true });
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.allowDrafts) {
      return true;
    }

    const query = context.switchToHttp().getRequest<Request>().query;

    if (
      requestsOtherThan(query['status'], 'published') ||
      requestsOtherThan(query['publicationState'], 'live')
    ) {
      throw new ForbiddenException('Only published content is available through this API');
    }

    return true;
  }
}

/**
 * True when the parameter is present and any of its values differs from the
 * allowed one.
 *
 * Values are collected recursively because Express parses `?status[0]=draft`
 * and `?status=a&status=b` into arrays and objects, not just strings — a plain
 * `=== 'draft'` check would be trivial to slip past.
 */
function requestsOtherThan(value: unknown, allowed: string): boolean {
  if (value === undefined) {
    return false;
  }

  const found: string[] = [];
  collectStrings(value, found);

  return found.some((entry) => entry !== allowed);
}

function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const entry of value) {
      collectStrings(entry, out);
    }
  } else if (value !== null && typeof value === 'object') {
    for (const entry of Object.values(value)) {
      collectStrings(entry, out);
    }
  }
}
