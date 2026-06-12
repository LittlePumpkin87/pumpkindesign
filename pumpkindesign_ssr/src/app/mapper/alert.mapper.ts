import { AlertItem } from '../interfaces/organism.interface';
import { getIconData, getLinkData, serializeRichText } from '../utils/content-helper';

export const mapAlertData = (rawData: any): { item: AlertItem } | undefined => {
  if (!rawData) {
    return undefined;
  }
  return {
    item: {
      headline: rawData.headline,
      description:
        typeof rawData.description === 'string'
          ? rawData.description
          : serializeRichText(rawData.description),
      icon: getIconData(rawData.icon),
      cta: getLinkData(rawData.cta),
    },
  };
};
