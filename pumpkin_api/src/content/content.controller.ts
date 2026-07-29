import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';

import { CacheResult } from '../cache/content-cache.service';
import { ContentService } from './content.service';
import { NavigationQueryDto } from './dto/navigation-query.dto';
import { PageByPathDto } from './dto/page-by-path.dto';

/**
 * Mirrors the Strapi routes the Angular frontend calls, on identical paths, so
 * this service can replace Strapi as the SSR server's BASE_PATH_STRAPI target
 * without a single frontend change.
 */
@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('page-by-path')
  async page(
    @Query() query: PageByPathDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    return this.withCacheHeader(await this.content.getPage(query.path), res);
  }

  @Get('head')
  async header(@Res({ passthrough: true }) res: Response): Promise<unknown> {
    return this.withCacheHeader(await this.content.getHeader(), res);
  }

  @Get('foot')
  async footer(@Res({ passthrough: true }) res: Response): Promise<unknown> {
    return this.withCacheHeader(await this.content.getFooter(), res);
  }

  @Get('navigation/render/:menu')
  async navigation(
    @Param('menu') menu: string,
    @Query() query: NavigationQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<unknown> {
    return this.withCacheHeader(await this.content.getNavigation(menu, query.type), res);
  }

  /** Makes cache behaviour visible in devtools, curl and the e2e tests. */
  private withCacheHeader<T>(result: CacheResult<T>, res: Response): T {
    res.setHeader('X-Cache', result.status);
    return result.data;
  }
}
