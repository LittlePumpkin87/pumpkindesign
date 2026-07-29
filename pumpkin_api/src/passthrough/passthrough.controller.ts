import { All, Controller, Logger, MethodNotAllowedException, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { StrapiService } from '../strapi/strapi.service';

/**
 * Safety net for any `/api/*` route that is not explicitly modelled above.
 *
 * Without it, adding a Strapi endpoint and forgetting to mirror it here would
 * break the site. Requests land here uncached and unmodified, so the fallback
 * behaves like the plain proxy that used to live in the SSR server.
 *
 * Must be registered last in AppModule — the wildcard would otherwise shadow the
 * explicit content and cache routes.
 */
@Controller()
export class PassthroughController {
  private readonly logger = new Logger(PassthroughController.name);

  constructor(private readonly strapi: StrapiService) {}

  @All('*splat')
  async passthrough(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    // Only reads are forwarded. The site has no write path, and silently
    // forwarding a mutation without its body — as the old proxy did — is worse
    // than refusing it.
    if (req.method !== 'GET') {
      throw new MethodNotAllowedException(`${req.method} is not supported by this API`);
    }

    this.logger.debug(`Passthrough (uncached): ${req.originalUrl}`);
    res.setHeader('X-Cache', 'BYPASS');
    return this.strapi.get(req.originalUrl);
  }
}
