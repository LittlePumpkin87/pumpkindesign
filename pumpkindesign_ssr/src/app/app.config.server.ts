import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { API_BASE } from './utils/api-base.token';
import { environment } from '../environments/environment';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {
      // Im SSR ueber den eigenen Express-Server -- siehe api-base.token.ts.
      provide: API_BASE,
      useFactory: () => `http://127.0.0.1:${process.env['PORT'] ?? 4200}${environment.API_URL}`,
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
