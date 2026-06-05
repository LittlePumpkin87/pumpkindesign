import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { LinkComponent } from '../../molecules/link/link.component';
import { HeaderData, NavigationItem } from '../../../interfaces/atom.interface';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lpd-navigation',
  imports: [CommonModule, RouterModule, LinkComponent],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss',
})
export class NavigationComponent {
  items = input<NavigationItem[]>([]);
  logoData = input<{ item: HeaderData } | undefined>();
  private readonly router = inject(Router);

  constructor() {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      takeUntilDestroyed(),
    );
  }

  isActive: boolean = false;
  toggleMenu(): void {
    this.isActive = !this.isActive;
  }
}
