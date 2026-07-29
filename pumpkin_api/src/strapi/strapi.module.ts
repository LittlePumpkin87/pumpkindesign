import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { Env } from '../config/env.validation';
import { StrapiService } from './strapi.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        baseURL: config.get('BASE_PATH_STRAPI', { infer: true }),
        timeout: config.get('STRAPI_TIMEOUT_MS', { infer: true }),
        headers: {
          Authorization: `Bearer ${config.get('STRAPI_API_TOKEN', { infer: true })}`,
          Accept: 'application/json',
        },
        // Status handling lives in StrapiService so 4xx (pass through) and
        // 5xx (retry, then allow stale) can be told apart explicitly.
        validateStatus: () => true,
      }),
    }),
  ],
  providers: [StrapiService],
  exports: [StrapiService],
})
export class StrapiModule {}
