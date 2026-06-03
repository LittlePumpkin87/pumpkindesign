import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { shareReplay, catchError, map, filter } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router, Scroll } from '@angular/router';

import { environment } from '../../environments/environment';
import { NavigationItem } from '../interfaces/atom.interface';
import { mapStrapiNavigation } from '../mapper/navigation.mapper';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly API_URL = environment.API_URL;

  private readonly NAV_ENDPOINT = `${this.API_URL}/navigation/render/main?type=TREE`;

  constructor() {
    this.initAnchorScroll();
  }

  private initAnchorScroll(): void {
    this.router.events.pipe(filter((e) => e instanceof Scroll)).subscribe((e) => {
      const anchor = e.anchor;
      if (!anchor) return;
      setTimeout(() => {
        const el = document.getElementById(anchor);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    });
  }

  // --- MAIN NAVIGATION ---

  public readonly navigationRequest$ = this.http.get<any[]>(this.NAV_ENDPOINT).pipe(
    map((rawData) => mapStrapiNavigation(rawData)),
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
