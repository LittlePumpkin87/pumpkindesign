import { Card } from '../interfaces/molecule.interface';
import { getIconData, getImageUrl, getLinkData, serializeRichText } from '../utils/content-helper';

export const mapCardData = (rawData: any): { items: Card[] } | undefined => {
  if (!rawData || !Array.isArray(rawData.card_item)) {
    return undefined;
  }
  return {
    items: rawData.card_item.map((item: any) => ({
      variant: item.variant,
      headline: item.headline,
      subline: item.subline,
      date: item.date,
      text: serializeRichText(item.text),
      icon: getIconData(item.icon),
      cta: getLinkData(item.cta),
      imgSrc: getImageUrl(item?.image),
    })),
  };
};
