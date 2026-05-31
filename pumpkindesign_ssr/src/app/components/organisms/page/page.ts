import { Component, input } from '@angular/core';
import { NavigationComponent } from '../navigation/navigation.component';
import { PageData } from '../../../interfaces/page.interface';

@Component({
  selector: 'lpd-page',
  imports: [NavigationComponent],
  templateUrl: './page.html',
  styleUrl: './page.scss',
})
export class Page {
  pageData = input<PageData>();
}
