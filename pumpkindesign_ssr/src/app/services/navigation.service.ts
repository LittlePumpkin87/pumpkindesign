import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { shareReplay, map, filter, tap } from 'rxjs/operators';
import { Router, Scroll } from '@angular/router';

import { environment } from '../../environments/environment';
import { mapHeaderData, mapStrapiNavigation } from '../mapper/navigation.mapper';
import { SeoService } from './seo.service';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly API_URL = environment.API_URL;
  private readonly seoService = inject(SeoService);
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
    .get<any[]>(`${this.API_URL}/navigation/render/main?type=TREE`)
    .pipe(
      map((data) => mapStrapiNavigation(data)),
      shareReplay(1),
    );

  private readonly headerRequest$ = this.http.get<any>(`${this.API_URL}/head`).pipe(
    map((data) => mapHeaderData(data)),
    tap((mappedData) => {
      if (mappedData?.item) {
        if (mappedData.item.favicon) {
          this.seoService.setFavicon(mappedData.item.favicon);
        }
        if (mappedData.item.meta_robots) {
          this.seoService.updateSeoTags({ meta_robots: mappedData.item.meta_robots });
        }
        if (mappedData.item.seo_description) {
          this.seoService.updateSeoTags({ seo_description: mappedData.item.seo_description });
        }
        if (mappedData.item.seo_image) {
          this.seoService.updateSeoTags({ seo_image: mappedData.item.seo_image });
        }
        if (mappedData.item.seo_keywords) {
          this.seoService.updateSeoTags({ seo_keywords: mappedData.item.seo_keywords });
        }
        if (mappedData.item.seo_title) {
          this.seoService.updateSeoTags({ seo_title: mappedData.item.seo_title });
        }
      }
    }),
    shareReplay(1),
  );

  readonly mainNavigation = toSignal(this.navigationRequest$, { initialValue: [] });
  readonly headerData = toSignal(this.headerRequest$, { initialValue: undefined });
}
