import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { PageItem } from '../interfaces/content.interface';

@Injectable({ providedIn: 'root' })
export class PageService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = environment.API_URL;

  public getPageContent(currentPath: string): Observable<PageItem | null> {
    const requestUrl = `${this.API_URL}/get-page-by-path?path=${currentPath}`;

    return this.http.get<any>(requestUrl).pipe(
      map(rawData => this.mapStrapiPage(rawData)),
      catchError((err) => {
        console.error(`[PageService] Failed to load ${currentPath}:`, err);
        return of(null);
      })
    );
  }

  private mapStrapiPage(rawData: any): PageItem | null {
    if (!rawData) return null;

    const data = rawData.data ? rawData.data : rawData;

    return {
      id: data.id,
      documentId: data.documentId,
      title: data.main_headline_h1,
      content: data.content || []
    };
  }
}