import { Component, effect, inject, input } from '@angular/core';
import { NavigationComponent } from '../navigation/navigation.component';
import { PageItem } from '../../../interfaces/page.interface';
import { NavigationService } from '../../../services/navigation.service';
import { ContentRendererComponent } from '../content-renderer/content-renderer';
import { PageService } from '../../../services/page.service';

@Component({
  selector: 'lpd-page',
  imports: [NavigationComponent, ContentRendererComponent],
  templateUrl: './page.html',
  styleUrl: './page.scss',
})
export class Page {
  pageData = input<PageItem>();
  public readonly navService = inject(NavigationService);
  public readonly pageService = inject(PageService);
  public navData = this.navService.mainNavigation;

  readonly page = this.pageService.currentPage;

  constructor() {
    effect(() => {
      console.log('3. [PageComponent] pageData() (Input):', this.pageData());
      console.log('4. [PageComponent] page() (Service):', this.page());
    });
  }
}
