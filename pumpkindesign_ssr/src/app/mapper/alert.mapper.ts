import { AlertItem } from '../interfaces/organism.interface';
import { getIconData, getLinkData, serializeRichText } from '../utils/content-helper';

export const mapAlertData = (rawData: any): { item: AlertItem } | undefined => {
  if (!rawData) {
    return undefined;
  }

  return {
    item: {
      headline: rawData.headline,
      description: serializeRichText(rawData.description),
      icon: getIconData(rawData.icon),
      cta: (() => {
        const cta = getLinkData(rawData.cta);
        return Array.isArray(cta) ? cta[0] : cta;
      })(),
    },
  };
};
