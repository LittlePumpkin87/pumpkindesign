import { CTA, Icon } from './atom.interface';

export interface TextImageItem {
  imgSrc?: string;
  imgAlt?: string;
  /** Intrinsic pixel size, rendered as width/height so the browser can reserve space. */
  imgWidth?: number;
  imgHeight?: number;
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
  imgWidth?: number;
  imgHeight?: number;
  footnote: string;
}

export interface TimelineItem {
  headline: string;
  period?: string;
  shortDescription?: string;
  longDescriptionHtml: string;
}

export interface Skill {
  imgSrc?: string;
  imgAlt?: string;
  name: string;
  description?: string;
  posX: number;
  posY: number;
  isMainSkill: boolean;
  connectedPathIds: string;
  subskills?: Skill[];
}
