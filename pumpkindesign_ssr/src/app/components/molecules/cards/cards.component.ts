import { Component, input } from '@angular/core';

@Component({
  selector: 'lpd-cards',
  imports: [],
  templateUrl: './cards.component.html',
  styleUrl: './cards.component.scss',
})
export class CardsComponent {

  items = input<any[]>(); // TODO change any to CardItem interface
}
