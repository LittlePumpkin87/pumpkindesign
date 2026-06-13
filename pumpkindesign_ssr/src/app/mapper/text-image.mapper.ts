import { TextImageItem } from '../interfaces/organism.interface';
import { getImageUrl, getLinkData, serializeRichText } from '../utils/content-helper';

export const mapTextImageData = (rawData: any): { item: TextImageItem } | undefined => {
  if (!rawData) {
    return undefined;
  }

  return {
    item: {
      headline: rawData.headline,
      subline: rawData.subline,
      text: serializeRichText(rawData.text),
      image_position: rawData.image_position,
      cta: getLinkData(rawData.cta),
      imgSrc: getImageUrl(rawData?.image),
      imgAlt: rawData.image.alternativeText,
    },
  };
};
