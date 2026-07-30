import { mergeApplicationConfig, ApplicationConfig, inject } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { HTTP_TRANSFER_CACHE_ORIGIN_MAP } from '@angular/common/http';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { API_BASE } from './utils/api-base.token';
import { environment } from '../environments/environment';

const serverOrigin = `http://127.0.0.1:${process.env['PORT'] ?? 4200}`;

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {
      provide: API_BASE,
      useFactory: () => `${serverOrigin}${environment.API_URL}`,
    },
    {
      provide: HTTP_TRANSFER_CACHE_ORIGIN_MAP,
      useFactory: () => ({
        [serverOrigin]: new URL(inject(PlatformLocation).href).origin,
      }),
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
