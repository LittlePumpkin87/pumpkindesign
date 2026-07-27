import { InjectionToken } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Basis-URL fuer die API-Requests.
 *
 * Browser: der relative Pfad aus dem Environment, aufgeloest gegen die
 * aktuelle Seite.
 *
 * SSR: Angular loest relative Pfade gegen die oeffentliche Origin auf
 * (relativeUrlsTransformerInterceptorFn in @angular/platform-server). Der
 * Server-Prozess wuerde sich damit ueber den Umweg von aussen selbst aufrufen.
 * app.config.server.ts ueberschreibt den Token deshalb mit der Loopback-Adresse
 * des eigenen Express-Servers, der den API-Proxy bereitstellt.
 */
export const API_BASE = new InjectionToken<string>('API_BASE', {
  providedIn: 'root',
  factory: () => environment.API_URL,
});
