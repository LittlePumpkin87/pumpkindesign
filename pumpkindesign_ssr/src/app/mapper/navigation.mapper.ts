import { HeaderData, NavigationItem } from '../interfaces/atom.interface';
import { getImageUrl } from '../utils/content-helper';

export function mapStrapiNavigation(rawData: any[]): NavigationItem[] {
  if (!rawData || !Array.isArray(rawData)) return [];

  return rawData.map((rawItem) => {
    const item: NavigationItem = {
      iconName: rawItem.additionalFields?.iconName,
      label: rawItem.title,
      href: rawItem.path,
      isInternal: rawItem.type === 'INTERNAL',
      isExternal: rawItem.type === 'EXTERNAL',
      isWrapper: rawItem.type === 'WRAPPER',
      type: rawItem.type,
      showInMenu: rawItem.menuAttached,
      locale: rawItem.locale,
      documentId: rawItem.related?.documentId || null,
      ...(rawItem.related.locale && { locale: rawItem.related.locale }),
    };

    if (rawItem.items && Array.isArray(rawItem.items) && rawItem.items.length > 0) {
      item.items = mapStrapiNavigation(rawItem.items);
    }

    return item;
  });
}

export function mapHeaderData(rawData: any): { item: HeaderData } | undefined {
  if (!rawData) {
    return undefined;
  }
  const data = rawData.data || rawData;

  return {
    item: {
      logo: getImageUrl(data.logo),
      logoAlt: data.logo.alternativeText,
      favicon: getImageUrl(data.favicon),
      robots: data.robots,
    },
  };
}
