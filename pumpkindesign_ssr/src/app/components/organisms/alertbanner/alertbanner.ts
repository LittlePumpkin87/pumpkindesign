import { Component, input } from '@angular/core';
import { IconComponent } from '../../atoms/icon/icon.component';
import { AlertItem } from '../../../interfaces/organism.interface';
import { CommonModule } from '@angular/common';
import { LinkComponent } from '../../molecules/link/link.component';

@Component({
  selector: 'lpd-alertbanner',
  imports: [IconComponent, CommonModule, LinkComponent],
  templateUrl: './alertbanner.html',
  styleUrl: './alertbanner.scss',
})
export class Alertbanner {
  item = input<AlertItem>();
  isVisible: boolean = true;

  close() {
    this.isVisible = false;
  }
}
