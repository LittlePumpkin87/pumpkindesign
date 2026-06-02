export interface CTA {
  label: string;
  href?: string;
  routerLink?: string;
  target: '_self' | '_blank';
  fragment?: string;
  iconName?: string;
  iconPrefix?: string;
  isExternal?: boolean;
  isInternal?: boolean;
}

export interface NavigationItem {
  showInMenu: boolean;
  label: string;
  href?: string;
  routerLink?: string;
}

export interface Icon {
  name: string;
  prefix?: string;
  color?: string;
  size?: string;
}

export interface TextBlock {
  richtext: string;
  headline: string;
}