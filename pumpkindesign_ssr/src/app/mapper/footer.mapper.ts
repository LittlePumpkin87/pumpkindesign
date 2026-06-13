import { CTA } from '../interfaces/atom.interface';
import { FooterItem } from '../interfaces/organism.interface';
import { getImageUrl, serializeRichText, getLinkData } from '../utils/content-helper';

export const mapFooterData = (rawData: any): { item: FooterItem } | undefined => {
  const data = rawData?.data || rawData;

  if (!data) {
    return undefined;
  }

  const mapCtaArray = (ctaSource: any): CTA[] => {
    if (!ctaSource || !Array.isArray(ctaSource)) {
      return [];
    }
    return ctaSource
      .map((item: any) => getLinkData(item))
      .filter((link: any): link is CTA => link !== undefined);
  };

  return {
    item: {
      leftColumn: mapCtaArray(data.footer_column_left?.cta),
      rightColumn: mapCtaArray(data.footer_column_right?.cta),
      socialCta: mapCtaArray(data.social_link),
      imgSrc: getImageUrl(data.image),
      footnote: serializeRichText(data.footnote),
    },
  };
};
