import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IconName,
  IconPrefix,
  IconProp,
} from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FontAwesomeService } from '../../../services/fontawesome.service';

@Component({
  selector: 'lpd-icon',
  imports: [CommonModule, FontAwesomeModule],
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.scss'],
})
export class IconComponent {
  public iconPrefix = input<string>();
  public iconName = input<string>();
  public color = input<string>();

  private readonly fontAwesomeService = inject(FontAwesomeService);
  private readonly effectivePrefix = computed(
    () => (this.iconPrefix() ?? 'fal') as IconPrefix,
  );

  public isIconAvailable = computed(() => {
    const name = this.iconName();
    const prefix = this.effectivePrefix();

    if (!name) return false;

    return this.fontAwesomeService.checkIconAvailable(prefix, name);
  });

  public icon = computed<IconProp>(() => {
    if (this.isIconAvailable()) {
      return [this.effectivePrefix(), this.iconName() as IconName];
    }
    return ['fas', 'exclamation-triangle'];
  });
}
