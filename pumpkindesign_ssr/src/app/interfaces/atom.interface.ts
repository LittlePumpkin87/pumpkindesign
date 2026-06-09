export interface CTA {
  label?: string;
  href?: string;
  target?: '_self' | '_blank';
  fragment?: string;
  isExternal?: boolean;
  isInternal?: boolean;
  icon?: Icon; 
  icon_position?: 'left' | 'right';
  link_style?: string;
  linktype?: string;
}

export interface NavigationItem {
  showInMenu: boolean;
  type: 'INTERNAL' | 'EXTERNAL' | 'WRAPPER';
  label: string;
  href?: string;
  documentId?: string | null;
  locale?: string;
  items: NavigationItem[]
}

export interface HeaderData {
  logo: string | undefined;
  logoAlt: string;
  favicon: string | undefined;
  robots: string;
}

export interface HeaderWrapper {
  item: HeaderData;
}
export interface Icon {
  name: string;
  prefix?: string;
  color?: string;
}

export interface TextBlock {
  subline: string;
  richtext: string;
  headline: string;
  centered: boolean;
  format: 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6';
}

export interface Image {
  src: string;
  alt: string;
}