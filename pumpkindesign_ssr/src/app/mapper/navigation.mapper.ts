import { NavigationItem } from '../interfaces/atom.interface';

export function mapStrapiNavigation(rawData: any[]): NavigationItem[] {
  if (!rawData || !Array.isArray(rawData)) return [];

  return rawData.map((rawItem) => {
    const item: NavigationItem = {
      iconName: rawItem.additionalFields.iconName,
      label: rawItem.title,
      href: rawItem.path,
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
