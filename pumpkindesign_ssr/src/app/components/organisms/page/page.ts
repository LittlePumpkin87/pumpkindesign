import { Component, input } from '@angular/core';
import { NavigationComponent } from '../navigation/navigation.component';
import { PageData } from '../../../interfaces/page.interface';
import { IconComponent } from "../../atoms/icon/icon.component";

@Component({
  selector: 'lpd-page',
  imports: [NavigationComponent, IconComponent],
  templateUrl: './page.html',
  styleUrl: './page.scss',
})
export class Page {
  pageData = input<PageData>();
}
