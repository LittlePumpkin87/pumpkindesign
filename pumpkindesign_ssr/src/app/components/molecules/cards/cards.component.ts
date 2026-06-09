import { Component, effect, input } from '@angular/core';
import { Card } from '../../../interfaces/molecule.interface';
import { IconComponent } from "../../atoms/icon/icon.component";
import { LinkComponent } from "../link/link.component";

@Component({
  selector: 'lpd-cards',
  imports: [IconComponent, LinkComponent],
  templateUrl: './cards.component.html',
  styleUrl: './cards.component.scss',
})
export class CardsComponent {

  items = input<Card[]>([]);
  
   constructor() {
    effect(() => {
      console.log('[Cards]', this.items());
    });
  }
}
