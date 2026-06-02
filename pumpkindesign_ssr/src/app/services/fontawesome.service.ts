import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';

@Injectable({ providedIn: 'root' })
export class FontAwesomeService {
  private readonly library = inject(FaIconLibrary);
  private readonly platformId = inject(PLATFORM_ID);
  readonly isReady = signal(false);

  async loadPacks(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      this.library.addIconPacks(far, fab, fas);
      this.isReady.set(true);
      return;
    }
    const [{ far: farL }, { fab: fabL }, { fas: fasL }] = await Promise.all([
      import('@fortawesome/free-regular-svg-icons'),
      import('@fortawesome/free-brands-svg-icons'),
      import('@fortawesome/free-solid-svg-icons'),
    ]);

    this.library.addIconPacks(farL, fabL, fasL);
    this.isReady.set(true);
  }

  checkIconAvailable(prefix: string, name: string): boolean {
    const available = this.library.getIconDefinition(prefix, name) !== null;

    if (!available) {
      console.warn(
        `[FontAwesome] Icon not found: ["${prefix}", "${name}"]. Check spelling or import.`,
      );
    }
    return available;
  }
}
