import { Injectable } from '@angular/core';
import { Item } from '../interfaces/page.interface';

export interface SectionConfiguration {
  id: string | null;
  forcedPrimary: boolean;
}

export interface SectionGroup {
  items: Item[];
  configuration: SectionConfiguration | null;
}

export interface PageStructure {
  groups: SectionGroup[];
  colors: string[];
}

@Injectable({ providedIn: 'root' })
export class ContentService {
  public preparePageStructure(rawSections: Item[]): PageStructure {
    if (!rawSections || !Array.isArray(rawSections)) {
      return { groups: [], colors: [] };
    }

    const groupedSections = this.groupSections(rawSections);
    const sectionBackgroundColors = this.calculateBackgroundColors(groupedSections);

    return {
      groups: groupedSections,
      colors: sectionBackgroundColors,
    };
  }

  /* searches for disruptor element or seperator to create sections groups and sets section configuration */

  private groupSections(rawSections: Item[]): SectionGroup[] {
    const groupedSections: SectionGroup[] = [];
    let currentItemGroup: Item[] = [];
    let pendingSectionConfiguration: SectionConfiguration | null = null;

    rawSections.forEach((cmsItem) => {
      if (!cmsItem) return;

      const cmsItemRecord = cmsItem as Record<string, unknown>;
      const isDisrupterElement =
        cmsItem.__component === 'sections.text-media' && cmsItemRecord['stoerer'] === true;
      const isSeparatorElement = cmsItem.__component === 'sections.separator';

      if (isSeparatorElement || isDisrupterElement) {
        if (currentItemGroup.length > 0) {
          groupedSections.push({
            items: currentItemGroup,
            configuration: pendingSectionConfiguration,
          });
          currentItemGroup = [];
          pendingSectionConfiguration = null;
        }

        const sectionConfiguration: SectionConfiguration = {
          id: (cmsItemRecord['sectionId'] as string) || null,
          forcedPrimary: cmsItemRecord['nextSectionIsPrimary'] === true,
        };

        if (isDisrupterElement) {
          groupedSections.push({
            items: [cmsItem],
            configuration: sectionConfiguration,
          });
        } else if (isSeparatorElement) {
          pendingSectionConfiguration = sectionConfiguration;
        }
      } else {
        currentItemGroup.push(cmsItem);
      }
    });

    if (currentItemGroup.length > 0) {
      groupedSections.push({
        items: currentItemGroup,
        configuration: pendingSectionConfiguration,
      });
    }

    return groupedSections;
  }

  /*  calculating Background Colors for Sections based on the following rules:

   1. if a section contains a "disrupter element" (stoerer)
   the background color of this section and the next and previous one should be white, and restarts the alternating pattern 
   2. if a section has the "forcedWhite" flag, the background color should be white, and restarts the alternating pattern
   3. if none of the above the alternating backgrounds start with white, starting at the first section after the Hero Component */

  private calculateBackgroundColors(groupedSections: SectionGroup[]): string[] {
    const backgroundColors: string[] = new Array(groupedSections.length).fill(null);

    groupedSections.forEach((group, index) => {
      if (group.configuration?.forcedPrimary) {
        backgroundColors[index] = 'primary';
      }
    });

    for (let i = backgroundColors.length - 1; i >= 0; i--) {
      if (
        backgroundColors[i] === null &&
        i < backgroundColors.length - 1 &&
        backgroundColors[i + 1] !== null
      ) {
        backgroundColors[i] = backgroundColors[i + 1] === 'secondary' ? 'primary' : 'secondary';
      }
    }
    // first section after Main Hero Component should start with white background
    if (backgroundColors.length > 0 && backgroundColors[0] === null) {
      backgroundColors[0] = 'primary';
    }
    for (let i = 1; i < backgroundColors.length; i++) {
      backgroundColors[i] ??= backgroundColors[i - 1] === 'secondary' ? 'primary' : 'secondary';
    }

    return backgroundColors;
  }
}
