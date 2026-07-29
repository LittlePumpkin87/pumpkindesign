import { TextImageItem } from '../interfaces/organism.interface';
import {
  getImageDimensions,
  getImageUrl,
  mapCtaArray,
  serializeRichText,
} from '../utils/content-helper';

export const mapTextImageData = (rawData: any): { item: TextImageItem } | undefined | null => {
  if (!rawData) {
    return undefined;
  }


  return {
    item: {
      headline: rawData.headline,
      subline: rawData.subline,
      text: serializeRichText(rawData.text),
      image_position: rawData.image_position,
      cta: mapCtaArray(rawData.cta),
      imgSrc: getImageUrl(rawData?.image),
      imgAlt: rawData?.image?.alternativeText || '',
      imgWidth: getImageDimensions(rawData?.image).width,
      imgHeight: getImageDimensions(rawData?.image).height,
    },
  };
};
