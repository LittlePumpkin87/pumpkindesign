import { Component, inject, input } from '@angular/core';
import { NavigationComponent } from '../navigation/navigation.component';
import { PageData } from '../../../interfaces/page.interface';
import { NavigationService } from '../../../services/navigation.service';

@Component({
  selector: 'lpd-page',
  imports: [NavigationComponent],
  templateUrl: './page.html',
  styleUrl: './page.scss',
})
export class Page {
  pageData = input<PageData>();
  public readonly navService = inject(NavigationService);
  public navData = this.navService.mainNavigation;
}
