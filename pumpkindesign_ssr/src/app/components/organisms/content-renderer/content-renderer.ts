import { Component, computed, inject, input, afterNextRender } from '@angular/core';
import { ContentService, PageStructure } from '../../../services/content.service';
import { DynamicRenderDirective } from '../../../utils/dynamic-render.directive';
import { Item } from '../../../interfaces/page.interface';

@Component({
  selector: 'lpd-content-renderer',
  standalone: true,
  imports: [DynamicRenderDirective],
  templateUrl: './content-renderer.html',
})
export class ContentRendererComponent {
  content = input<Item[]>();
  renderAsSections = input<boolean>(true);
  private readonly contentService = inject(ContentService);

  pageStructure = computed<PageStructure>(() => {
    const itemsToRender = this.content();
    if (!itemsToRender || itemsToRender.length === 0) {
      return { groups: [], colors: [], navItems: [] };
    }

    if (this.renderAsSections()) {
      return this.contentService.preparePageStructure(itemsToRender);
    }

    return { groups: [], colors: [], navItems: [] };
  });

  constructor() {
    afterNextRender(() => {
      const hash = globalThis.location.hash.replace('#', '');
      if (hash) {
        setTimeout(() => {
          const targetElement = document.getElementById(hash);
          if (targetElement) {
            const prefersReducedMotion = globalThis.matchMedia(
              '(prefers-reduced-motion: reduce)',
            ).matches;

            targetElement.scrollIntoView({
              behavior: prefersReducedMotion ? 'auto' : 'smooth',
              block: 'start',
            });
            targetElement.setAttribute('tabindex', '-1');
            targetElement.focus({ preventScroll: true });
            targetElement.style.outline = 'none';
          }
        }, 50);
      }
    });
  }
}
