import { Type } from '@angular/core';
import { TextblockComponent } from '../components/atoms/textblock/textblock';
import { CardsComponent } from '../components/molecules/cards/cards.component';
import { TextImage } from '../components/organisms/text-image/text-image';
import { Alertbanner } from '../components/organisms/alertbanner/alertbanner';
import { SpiderWebComponent } from '../components/molecules/spiderweb/spiderweb';

interface ComponentConfig {
  tagName: string;
  component: Type<unknown>;
}

// Components which are rendered in dynamic zone

export const COMPONENT_REGISTRY: Record<string, ComponentConfig> = {
  'atoms.textblock': {
    tagName: 'lpd-textblock',
    component: TextblockComponent,
  },
  'molecules.card-list': {
    tagName: 'lpd-cards',
    component: CardsComponent,
  },
  'organisms.image-text': {
    tagName: 'lpd-text-image',
    component: TextImage,
  },
  'organisms.alertbanner': {
    tagName: 'lpd-alertbanner',
    component: Alertbanner,
  },
  'organisms.spider-tech-web': {
    tagName: 'lpd-spider-web',
    component: SpiderWebComponent,
  },
};
