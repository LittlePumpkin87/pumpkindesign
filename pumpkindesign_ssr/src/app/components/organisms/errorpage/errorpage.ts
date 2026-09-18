import { Component, input } from '@angular/core';
import { IconComponent } from '../../atoms/icon/icon.component'
@Component({
  selector: 'lpd-errorpage',
  imports: [IconComponent],
  templateUrl: './errorpage.html',
  styleUrl: './errorpage.scss',
})
export class Errorpage {
  error = input<number | null>();
}
