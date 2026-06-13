import { CTA } from '../interfaces/atom.interface';
import { TextImageItem } from '../interfaces/organism.interface';
import { getImageUrl, getLinkData, serializeRichText } from '../utils/content-helper';

export const mapTextImageData = (rawData: any): { item: TextImageItem } | undefined => {
  if (!rawData) {
    return undefined;
  }
  // Map CTA Array
  let normalizedCta: any[] = [];
  if (Array.isArray(rawData.cta)) {
    normalizedCta = rawData.cta.map((link: CTA) => getLinkData(link)).filter(Boolean);
  } else if (rawData.cta) {
    normalizedCta = [getLinkData(rawData.cta)];
  } else {
    normalizedCta = [];
  }

  return {
    item: {
      headline: rawData.headline,
      subline: rawData.subline,
      text: serializeRichText(rawData.text),
      image_position: rawData.image_position,
      cta: normalizedCta,
      imgSrc: getImageUrl(rawData?.image),
      imgAlt: rawData.image.alternativeText,
    },
  };
};
