import { Component, input } from '@angular/core';
import { FooterItem } from '../../../interfaces/organism.interface';
import { LinkComponent } from '../../molecules/link/link.component';

@Component({
  selector: 'lpd-footer',
  imports: [LinkComponent],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  item = input<FooterItem>();
}
