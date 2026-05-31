import { Component, input } from '@angular/core';
import { Icon } from '../../../interfaces/atom.interface';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'lpd-icon',
  imports: [CommonModule],
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.scss'],
})
export class IconComponent {
  icon = input<Icon>();
}
