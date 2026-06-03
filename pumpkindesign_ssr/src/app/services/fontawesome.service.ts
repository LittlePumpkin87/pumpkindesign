import { Injectable, inject, signal } from '@angular/core';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';

@Injectable({ providedIn: 'root' })
export class FontAwesomeService {
  private readonly library = inject(FaIconLibrary);
  readonly isReady = signal(false);

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
