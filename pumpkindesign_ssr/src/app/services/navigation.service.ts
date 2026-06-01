import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { shareReplay, catchError, filter } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router, Scroll } from '@angular/router';
import { environment } from '../../environments/environment';
import { NavigationItem } from '../interfaces/atom.interface';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = environment.API_URL;

  private readonly NAV_ENDPOINT = `${this.API_URL}/navigation/render/main?type=RFR`;
  private readonly router = inject(Router);

  constructor() {
    this.initAnchorScroll();
  }

  private initAnchorScroll(): void {
    this.router.events.pipe(filter((e) => e instanceof Scroll)).subscribe((e) => {
      const anchor = e.anchor;
      if (!anchor) return;

      setTimeout(() => {
        const el = document.getElementById(anchor);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    });
  }

  // --- MAIN NAVIGATION ---

  private readonly navigationRequest$ = this.http.get<NavigationItem[]>(this.NAV_ENDPOINT).pipe(
    shareReplay(1),
    catchError((err) => {
      console.error('[NavigationService] Main navigation error:', err);
      return of([] as NavigationItem[]);
    }),
  );

  readonly mainNavigation = toSignal(this.navigationRequest$, {
    initialValue: [],
  });
}
