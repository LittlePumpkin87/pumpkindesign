export interface CTA {
  label: string;
  href?: string;
  routerLink?: string;
  target?: '_self' | '_blank';
  fragment?: string;
  iconName?: string;
  iconPrefix?: string;
  isExternal?: boolean;
  isInternal?: boolean;
}

export interface NavigationItem {
  showInMenu: boolean;
  type: 'INTERNAL' | 'EXTERNAL' | 'WRAPPER';
  label: string;
  href?: string;
  documentId?: string | null;
  locale?: string;
  items?: NavigationItem[];
}

export interface Icon {
  name: string;
  prefix?: string;
  color?: string;
  size?: string;
}

export interface TextBlock {
  subline: string;
  richtext: string;
  headline: string;
}

export interface Image {
  src: string;
  alt: string;
}