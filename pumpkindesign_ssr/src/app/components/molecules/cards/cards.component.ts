import { Component, input, Input } from '@angular/core';
import { ImageComponent } from '../../atoms/image/image.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { LinkComponent } from '../link/link.component';
import { IconProp, SizeProp } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'lpd-cards',
  imports: [ImageComponent, IconComponent, LinkComponent],
  templateUrl: './cards.component.html',
  styleUrl: './cards.component.scss',
})
export class CardsComponent {

  card = input<any>(); // Define the input property for the card data
}
