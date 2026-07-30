import { InjectionToken, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../environments/environment';

export const API_BASE = new InjectionToken<string>('API_BASE', {
  providedIn: 'root',
  factory: () => `${inject(DOCUMENT).location.origin}${environment.API_URL}`,
});
