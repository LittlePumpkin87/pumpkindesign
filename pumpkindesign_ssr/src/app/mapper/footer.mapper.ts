import { FooterItem } from '../interfaces/organism.interface';
import {
  getImageDimensions,
  getImageUrl,
  mapCtaArray,
  serializeRichText,
} from '../utils/content-helper';

export const mapFooterData = (rawData: any): { item: FooterItem } | undefined => {
  const data = rawData?.data || rawData;

  if (!data) {
    return undefined;
  }

  return {
    item: {
      leftColumn: mapCtaArray(data.footer_column_left?.cta),
      rightColumn: mapCtaArray(data.footer_column_right?.cta),
      socialCta: mapCtaArray(data.social_link),
      imgSrc: getImageUrl(data.image),
      imgAlt: data.image?.alternativeText || '',
      imgWidth: getImageDimensions(data.image).width,
      imgHeight: getImageDimensions(data.image).height,
      footnote: serializeRichText(data.footnote),
    },
  };
};
