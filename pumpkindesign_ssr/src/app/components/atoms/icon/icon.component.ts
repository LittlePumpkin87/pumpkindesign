import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lpd-icon',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.scss'],
})
export class IconComponent {
  public iconPrefix = input<string>('fas');
  public iconName = input<string>();
  public color = input<string>();

  public computedClasses = computed(() => {
    const name = this.iconName();
    const prefix = this.iconPrefix();

    if (!name) {
      console.warn('Icon name' + name + 'is not valid. Please provide a valid icon name.');
      return ['fa-solid', 'fa-triangle-exclamation', 'default-fallback'];
    }

    let fontClass = 'fa-regular';
    if (prefix === 'fas' || prefix === 'fa-solid') fontClass = 'fa-solid';
    if (prefix === 'far' || prefix === 'fa-regular') fontClass = 'fa-regular';
    if (prefix === 'fab' || prefix === 'fa-brands') fontClass = 'fa-brands';

    return [fontClass, `fa-${name}`];
  });
}
