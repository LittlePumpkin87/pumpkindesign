import { Module } from '@nestjs/common';

import { CacheModule } from '../cache/cache.module';
import { StrapiModule } from '../strapi/strapi.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  imports: [StrapiModule, CacheModule],
  controllers: [ContentController],
  providers: [ContentService],
})
export class ContentModule {}
