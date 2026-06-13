import { CTA, Icon } from './atom.interface';

export interface TextImageItem {
  imgSrc?: string;
  imgAlt?: string;
  cta: CTA[];
  text: string;
  headline: string;
  subline: string;
  image_position: 'right' | 'left';
}

export interface AlertItem {
  icon?: Icon;
  headline: string;
  description: string;
  cta?: CTA;
}

export interface FooterItem {
  rightColumn: CTA[];
  leftColumn: CTA[];
  socialCta: CTA[];
  imgSrc?: string;
  imgAlt?: string;
  footnote: string;
}
