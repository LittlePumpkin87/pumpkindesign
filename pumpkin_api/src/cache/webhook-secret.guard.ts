import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';
import { Request } from 'express';

import { Env } from '../config/env.validation';

/**
 * Verifies the shared secret Strapi sends with its webhook.
 *
 * Both sides are hashed before comparison so that `timingSafeEqual` always gets
 * two equal-length buffers (it throws otherwise) and the length of the secret
 * does not leak through the comparison.
 */
@Injectable()
export class WebhookSecretGuard implements CanActivate {
  private readonly expected: Buffer;

  constructor(config: ConfigService<Env, true>) {
    this.expected = createHash('sha256')
      .update(config.get('STRAPI_WEBHOOK_SECRET', { infer: true }))
      .digest();
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header('x-webhook-secret');

    if (!provided) {
      throw new UnauthorizedException('Missing X-Webhook-Secret header');
    }

    const actual = createHash('sha256').update(provided).digest();
    if (!timingSafeEqual(actual, this.expected)) {
      throw new UnauthorizedException('Invalid X-Webhook-Secret header');
    }

    return true;
  }
}
