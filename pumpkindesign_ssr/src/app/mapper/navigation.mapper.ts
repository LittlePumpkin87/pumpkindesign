import { HeaderData, NavigationItem } from '../interfaces/atom.interface';
import { getImageDimensions, getImageUrl } from '../utils/content-helper';

export function mapStrapiNavigation(rawData: any[]): NavigationItem[] {
  if (!rawData || !Array.isArray(rawData)) return [];

  return rawData.map((rawItem) => {
    let navIcon = undefined;
    if (rawItem.additionalFields?.iconName) {
      navIcon = {
        name: rawItem.additionalFields.iconName,
        prefix: 'fas',
      };
    }

    const item: NavigationItem = {
      icon: navIcon,
      icon_position: 'right',
      label: rawItem.title,
      href: rawItem.path,
      isInternal: rawItem.type === 'INTERNAL',
      isExternal: rawItem.type === 'EXTERNAL',
      isWrapper: rawItem.type === 'WRAPPER',
      type: rawItem.type,
      showInMenu: rawItem.menuAttached,
      locale: rawItem.locale,
      documentId: rawItem.related?.documentId || null,
      ...(rawItem.related?.locale && { locale: rawItem.related.locale }),
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
      logoWidth: getImageDimensions(data.logo).width,
      logoHeight: getImageDimensions(data.logo).height,
      favicon: getImageUrl(data.favicon),
      meta_robots: data.meta_robots,
      seo_image: getImageUrl(data.seo_image),
      seo_description: data.seo_description,
      seo_title: data.seo_title,
      seo_keywords: data.seo_keywords,
    },
  };
}
