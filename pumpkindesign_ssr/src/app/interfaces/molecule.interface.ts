import { CTA, Icon } from './atom.interface';

export interface Card {
  variant: string;
  icon_variant: boolean;
  headline?: string;
  subline?: string;
  date?: string;
  imgSrc?: string;
  imgAlt?: string;
  icon?: Icon;
  text?: string;
  cta?: CTA;
}