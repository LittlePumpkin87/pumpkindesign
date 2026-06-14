import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { shareReplay, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { environment } from '../../environments/environment';
import { mapFooterData } from '../mapper/footer.mapper';
import { FooterItem } from '../interfaces/organism.interface';

@Injectable({ providedIn: 'root' })
export class FooterService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = environment.API_URL;

  private readonly footerRequest$ = this.http.get<any>(`${this.API_URL}/foot`).pipe(
    map((data) => {
      const mappedData = mapFooterData(data);
      return mappedData?.item;
    }),

    catchError((error) => {
      console.error('❌ [FooterService] Error fetching footer data:', error);
      return of(undefined);
    }),

    shareReplay(1),
  );

  readonly footerData = toSignal<FooterItem | undefined>(this.footerRequest$, {
    initialValue: undefined,
  });
}
