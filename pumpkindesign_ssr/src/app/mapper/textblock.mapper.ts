import { TextBlock } from '../interfaces/atom.interface';
import { serializeRichText } from '../utils/content-helper';

export const mapTextBlockData = (rawData: any): { item: TextBlock } | undefined => {
  if (!rawData) {
    return undefined;
  }
  return {
    item: {
      headline: rawData.headline,
      subline: rawData.subline,
      format: rawData.format,
      richtext: serializeRichText(rawData.text),
      centered: rawData.centered_text || 'left',
    },
  };
};
