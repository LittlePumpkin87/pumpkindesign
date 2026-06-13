import { AlertItem } from '../interfaces/organism.interface';
import { getIconData, getLinkData } from '../utils/content-helper';

export const mapAlertData = (rawData: any): { item: AlertItem } | undefined => {
  if (!rawData) {
    return undefined;
  }
  return {
    item: {
      headline: rawData.headline,
      description:rawData.description,
      icon: getIconData(rawData.icon),
      cta: getLinkData(rawData.cta),
    },
  };
};
