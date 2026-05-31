import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LinkComponent } from "../../molecules/link/link.component";
import { CTA } from '../../../interfaces/atom.interface';


@Component({
  selector: 'lpd-navigation',
  imports: [CommonModule, RouterModule, LinkComponent],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
})
export class NavigationComponent {

  items = input<CTA[]>();

  isActive: boolean = false;
  toggleMenu(): void {
    this.isActive = !this.isActive;
  }
}
