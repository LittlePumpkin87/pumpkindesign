import { Component, effect, input } from '@angular/core';
import { TextBlock } from '../../../interfaces/atom.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lpd-textblock',
  imports: [CommonModule],
  templateUrl: './textblock.html',
  styleUrl: './textblock.scss',
})
export class TextblockComponent {
  item = input<TextBlock>();

 constructor() {
    effect(() => {
      console.log('[Textblock]', this.item());
    });
  }
}
