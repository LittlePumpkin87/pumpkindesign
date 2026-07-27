import { TimelineItem } from '../interfaces/organism.interface';
import { serializeRichText } from '../utils/content-helper';

export const mapTimelineData = (rawData: any): { items: TimelineItem[] } | undefined => {
  if (!rawData?.timeline_item) {
    return undefined;
  }
  return {
    items: rawData.timeline_item.map(
      (item: any): TimelineItem => ({
        headline: item.headline,
        period: item.period || undefined,
        shortDescription: item.short_description || undefined,
        longDescriptionHtml: serializeRichText(item.long_description),
      }),
    ),
  };
};
