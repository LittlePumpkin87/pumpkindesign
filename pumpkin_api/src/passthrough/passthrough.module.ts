import { Module } from '@nestjs/common';

import { StrapiModule } from '../strapi/strapi.module';
import { PassthroughController } from './passthrough.controller';

@Module({
  imports: [StrapiModule],
  controllers: [PassthroughController],
})
export class PassthroughModule {}
