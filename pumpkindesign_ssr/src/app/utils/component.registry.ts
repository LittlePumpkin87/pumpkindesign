import { Type } from '@angular/core';
import { TextblockComponent } from '../components/atoms/textblock/textblock';
import { CardsComponent } from '../components/molecules/cards/cards.component';

interface ComponentConfig {
  tagName: string;
  component: Type<unknown>;
}

export const COMPONENT_REGISTRY: Record<string, ComponentConfig> = {
  'atoms.textblock': {
    tagName: 'lpd-textblock',
    component: TextblockComponent,
  },
  'molecules.card-list': {
    tagName: 'lpd-cards',
    component: CardsComponent,
  },
};
