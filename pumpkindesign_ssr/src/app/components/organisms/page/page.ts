import { Component, inject, input } from '@angular/core';
import { NavigationComponent } from '../navigation/navigation.component';
import { PageItem } from '../../../interfaces/page.interface';
import { NavigationService } from '../../../services/navigation.service';
import { ContentRendererComponent } from '../content-renderer/content-renderer';
import { PageService } from '../../../services/page.service';
import { Alertbanner } from '../alertbanner/alertbanner';
import { Footer } from '../footer/footer';
import { FooterService } from '../../../services/footer.service';

@Component({
  selector: 'lpd-page',
  imports: [NavigationComponent, ContentRendererComponent, Alertbanner, Footer],
  templateUrl: './page.html',
  styleUrl: './page.scss',
})
export class Page {
  pageData = input<PageItem>();
  public readonly navService = inject(NavigationService);
  public readonly pageService = inject(PageService);
  public readonly footerService = inject(FooterService);
  public navData = this.navService.mainNavigation;
  readonly header = this.navService.headerData;
  readonly page = this.pageService.currentPage;
  readonly footerData = this.footerService.footerData;
}
