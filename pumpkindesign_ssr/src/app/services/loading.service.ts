import { Injectable, computed, inject } from '@angular/core';
import { PageService } from './page.service';
import { NavigationService } from './navigation.service';

@Injectable({ providedIn: 'root' })
export class LoadingStateService {
  private readonly pageService = inject(PageService);
  private readonly navService = inject(NavigationService);
  readonly isAppReady = computed(() => {
    const isNavReady = this.navService.isReady();
    const pageData = this.pageService.currentPage();
    const hasError = this.pageService.hasError();
    const loadFinished = isNavReady && pageData !== undefined || hasError;
    return loadFinished;
  });
}
