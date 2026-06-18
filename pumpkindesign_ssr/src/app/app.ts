import { Component, effect, inject, signal, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { LoadingStateService } from './services/loading.service';

@Component({
  selector: 'lpd-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  public readonly loadingService = inject(LoadingStateService);
  private readonly platformId = inject(PLATFORM_ID);
  public showLoader = signal(true);
  public fadeLoader = signal(false);

  constructor() {
    effect(() => {
      if (this.loadingService.isAppReady() && isPlatformBrowser(this.platformId)) {
        setTimeout(() => {
          this.fadeLoader.set(true);
          setTimeout(() => {
            this.showLoader.set(false);
          }, 100);
        }, 300);
      }
    });
  }
}
