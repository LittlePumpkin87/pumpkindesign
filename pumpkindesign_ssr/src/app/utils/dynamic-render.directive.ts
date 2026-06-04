import {
  Directive,
  ViewContainerRef,
  Injector,
  input,
  effect,
  ComponentRef,
  inject,
} from '@angular/core';
import { COMPONENT_REGISTRY } from '../utils/component.registry';
import { COMPONENT_MAPPERS } from '../utils/mapper.registry';
import { Item } from '../interfaces/page.interface';
import { DomSanitizer } from '@angular/platform-browser';
// Directive to dynamically render components based on CMS content.
// It listens for changes in the input content item and renders the corresponding component from the COMPONENT_REGISTRY.
// The directive also uses mappers defined in COMPONENT_MAPPERS to transform CMS data into component inputs.

@Directive({
  selector: '[lpdDynamicRender]',
  standalone: true,
})
export class DynamicRenderDirective {
  lpdDynamicRender = input.required<Item>();
  sectionColor = input<string | undefined>(undefined);

  private dynamicComponentRef: ComponentRef<unknown> | null = null;

  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly componentInjector = inject(Injector);
  private readonly sanitizer = inject(DomSanitizer);
  constructor() {
    effect(() => {
      const cmsItem = this.lpdDynamicRender();
      const sectionColor = this.sectionColor();

      // clean container before rendering new component
      this.viewContainerRef.clear();

      if (!cmsItem?.__component) {
        return;
      }

      const compType = cmsItem.__component;
      const registryEntry = COMPONENT_REGISTRY[compType];

      if (!registryEntry?.component) {
        console.warn(`[DynamicRender] no component for "${compType}" found in COMPONENT_REGISTRY!`);
        return;
      }

      // create dynamic component
      this.dynamicComponentRef = this.viewContainerRef.createComponent(registryEntry.component, {
        injector: this.componentInjector,
      });

      // fetch Data from mapper and assign to component inputs
      const componentMapper = COMPONENT_MAPPERS[compType];
      if (componentMapper) {
        try {
          const mappedInputs = componentMapper(
            cmsItem,
            sectionColor,
            this.sanitizer,
            this.componentInjector,
          ) as Record<string, unknown>;

          // Filter out reserved keys and assign the rest to the component instance
          if (mappedInputs && typeof mappedInputs === 'object') {
            Object.keys(mappedInputs).forEach((inputKey: string) => {
              const isReservedKey = inputKey === '__component';

              if (!isReservedKey) {
                this.dynamicComponentRef?.setInput(inputKey, mappedInputs[inputKey]);
              }
            });
          }
        } catch (error) {
          console.error(`[DynamicRender] Error in mapping for "${compType}":`, error);
        }
      }
    });
  }
}
