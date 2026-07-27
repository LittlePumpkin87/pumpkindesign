import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { HTTP_TRANSFER_CACHE_ORIGIN_MAP } from '@angular/common/http';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { API_BASE } from './utils/api-base.token';
import { environment } from '../environments/environment';

const serverOrigin = `http://127.0.0.1:${process.env['PORT'] ?? 4200}`;
const clientOrigin = environment.BASE_URL.startsWith('http')
  ? environment.BASE_URL
  : `https://${environment.BASE_URL}`;

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {
      provide: API_BASE,
      useFactory: () => `${serverOrigin}${environment.API_URL}`,
    },
    {
      provide: HTTP_TRANSFER_CACHE_ORIGIN_MAP,
      useValue: { [serverOrigin]: clientOrigin },
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
