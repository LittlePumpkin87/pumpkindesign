import { Component, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../atoms/icon/icon.component';
import { RouterModule } from '@angular/router';
import { CTA } from '../../../interfaces/atom.interface';

@Component({
  selector: 'lpd-link',
  imports: [CommonModule, IconComponent, RouterModule],
  templateUrl: './link.component.html',
  styleUrls: ['./link.component.scss'],
})
export class LinkComponent {
  item = input<CTA>();

   constructor() {

      effect(() => {
      console.log('🧭 Navigations-Daten im Frontend IM LINK:', this.item());
    });
  }
}
