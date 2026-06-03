import { Component, Input, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentRegistry } from '../../../utils/component.registry';
import { MapperRegistry } from '../../../utils/mapper.registry';

interface RenderableBlock {
  component: Type<any>;
  item: any;
}

@Component({
  selector: 'lpd-content-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './content-renderer.html',
  styleUrl: './content-renderer.scss',
})
export class ContentRendererComponent {
  public renderableBlocks: RenderableBlock[] = [];

  @Input({ required: true }) set rawBlocks(blocks: any[]) {
    if (!blocks || !Array.isArray(blocks)) {
      this.renderableBlocks = [];
      return;
    }

    this.renderableBlocks = blocks.reduce((acc: RenderableBlock[], rawData: any) => {
      const componentName = rawData.__component;
      
      const ComponentClass = ComponentRegistry[componentName];
      const mapperFunction = MapperRegistry[componentName];

      if (ComponentClass && mapperFunction) {
        const cleanItem = mapperFunction(rawData);
        
        acc.push({
          component: ComponentClass,
          item: cleanItem
        });
      } else {
        console.warn(`[ContentRenderer] Missing registry entries for: ${componentName}`);
      }

      return acc;
    }, []);
  }
}