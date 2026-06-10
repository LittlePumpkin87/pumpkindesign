export interface PageItem {
  id: number;
  documentId: string;
  slug: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  seo_image?: string;
  meta_robots?: string;
  main_headline_h1: string;
  main_text: unknown;
  content: Item[];
}
export interface Item {
  __component?: string;
  children?: Item[];
  items?: Item[];
}

export interface NavigationItem {
  id: number;
  documentId: string;
  title: string;
  menuAttached: boolean;
  _path: string;
  type: 'WRAPPER' | 'INTERNAL' | 'EXTERNAL';
  slug: string;
  related: NavigationItem;
  label: string;
  items: NavigationItem[];
}

export interface PageResponse {
  data: PageItem;
  meta: Record<string, unknown>;
}

export default PageResponse;
