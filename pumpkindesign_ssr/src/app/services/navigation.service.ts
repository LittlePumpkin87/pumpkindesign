import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { shareReplay, map, filter } from 'rxjs/operators';
import { Router, Scroll } from '@angular/router';

import { environment } from '../../environments/environment';
import { mapHeaderData, mapStrapiNavigation } from '../mapper/navigation.mapper';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly API_URL = environment.API_URL;

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

  private readonly navigationRequest$ = this.http
    .get<any[]>(`${this.API_URL}/api/navigation/render/main?type=TREE`)
    .pipe(
      map((data) => mapStrapiNavigation(data)),
      shareReplay(1),
    );

  private readonly headerRequest$ = this.http.get<any>(`${this.API_URL}/api/head`).pipe(
    map((data) => mapHeaderData(data)),
    shareReplay(1),
  );

  readonly mainNavigation = toSignal(this.navigationRequest$, { initialValue: [] });
  readonly headerData = toSignal(this.headerRequest$, { initialValue: undefined });
}
