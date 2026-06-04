import { Component, effect, input } from '@angular/core';
import { Card } from '../../../interfaces/molecule.interface';
import { IconComponent } from "../../atoms/icon/icon.component";

@Component({
  selector: 'lpd-cards',
  imports: [IconComponent],
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
