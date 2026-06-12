import { Component, input } from '@angular/core';
import { TextImageItem } from '../../../interfaces/organism.interface';
import { LinkComponent } from "../../molecules/link/link.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lpd-text-image',
  imports: [LinkComponent, CommonModule],
  templateUrl: './text-image.html',
  styleUrl: './text-image.scss',
})
export class TextImage {

  item = input<TextImageItem>();
}
