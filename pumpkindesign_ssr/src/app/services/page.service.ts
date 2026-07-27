import { mapAlertData } from './../mapper/alert.mapper';
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  map,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';
import { API_BASE } from '../utils/api-base.token';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, UrlSegment } from '@angular/router';
import { ContentService } from './content.service';
import { serializeRichText } from '../utils/content-helper';
import PageResponse, { PageItem } from '../interfaces/page.interface';
import { SeoService } from './seo.service';

@Injectable({ providedIn: 'root' })
export class PageService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = inject(API_BASE);
  private readonly router = inject(Router);
  private readonly contentService = inject(ContentService);
  private readonly seoService = inject(SeoService);

  private readonly _isLoading = signal(true);
  readonly isLoading = this._isLoading.asReadonly();

  readonly currentPage = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => {
        const urlTree = this.router.parseUrl(this.router.url);
        const primaryGroup = urlTree.root.children['primary'];
        const segments = primaryGroup?.segments ?? [];
        return this.getApiPathFromUrl(segments);
      }),
      distinctUntilChanged(),
      tap(() => this._isLoading.set(true)),
      switchMap((apiPath) =>
        this.getPageDetails(apiPath).pipe(
          tap(() => this._isLoading.set(false)),
          catchError((err) => {
            console.error('[PageService] Critical error loading the page:', err);
            this._isLoading.set(false);
            return of(undefined);
          }),
        ),
      ),
    ),
    { initialValue: undefined },
  );

  private getApiPathFromUrl(segments: UrlSegment[]): string {
    if (segments.length === 0) return '';
    return segments.map((s) => s.path).join('/');
  }

  getPageDetails(path: string | undefined): Observable<PageItem | undefined> {
    const queryPath = path ? `${path}` : '/';
    return this.http.get<PageResponse>(`${this.API_URL}/page-by-path?path=${queryPath}`).pipe(
      map((response) => {
        const page = response?.data;
        if (page) {
          if (page.content) this.contentService.preparePageStructure(page.content);
          if (page.main_text) page.main_text = serializeRichText(page.main_text);
          if (page.alertbanner) page.alertbanner = mapAlertData(page.alertbanner)?.item;
        }
        return page;
      }),
      tap((mapped) => {
        this.seoService.updateSeoTags(mapped);
        this.seoService.setCanonicalUrl(path ? `/${path}` : '/');
      }),
    );
  }
}
