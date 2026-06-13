import { CTA } from '../interfaces/atom.interface';
import { TextImageItem } from '../interfaces/organism.interface';
import { getImageUrl, getLinkData, serializeRichText } from '../utils/content-helper';

export const mapTextImageData = (rawData: any): { item: TextImageItem } | undefined | null => {
  if (!rawData) {
    return undefined;
  }
  const rawCta = rawData.cta;
  let rawCtaArray: CTA[] = [];
  if (Array.isArray(rawCta)) {
    rawCtaArray = rawCta;
  } else if (rawCta) {
    rawCtaArray = [rawCta];
  }
  const normalizedCta = rawCtaArray.map((link: any) => getLinkData(link)).filter(Boolean);
  return {
    item: {
      headline: rawData.headline,
      subline: rawData.subline,
      text: serializeRichText(rawData.text),
      image_position: rawData.image_position,
      cta: normalizedCta,
      imgSrc: getImageUrl(rawData?.image),
      imgAlt: rawData?.image?.alternativeText || '',
    },
  };
};
