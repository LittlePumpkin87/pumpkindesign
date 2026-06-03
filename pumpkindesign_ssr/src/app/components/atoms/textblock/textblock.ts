import { Component, input } from '@angular/core';
import { TextBlock } from '../../../interfaces/atom.interface';

@Component({
  selector: 'lpd-textblock',
  imports: [],
  templateUrl: './textblock.html',
  styleUrl: './textblock.scss',
})
export class Textblock {

  content = input<TextBlock>();

}
