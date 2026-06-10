import { Inject, Injectable } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { PageItem } from '../interfaces/page.interface';
import { DOCUMENT } from '@angular/common';
@Injectable({
  providedIn: 'root',
})
export class SeoService {
  constructor(
    private readonly title: Title,
    private readonly meta: Meta,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  updateSeoTags(pageData: Partial<PageItem> | undefined | null) {
    if (!pageData) return;

    if (pageData.seo_title) {
      this.title.setTitle(`${pageData.seo_title} | Little Pumpkin Design`);
      this.meta.updateTag({ property: 'og:title', content: pageData.seo_title });
    } else {
      this.title.setTitle('Little Pumpkin Design');
    }

    if (pageData.seo_description) {
      this.meta.updateTag({ name: 'description', content: pageData.seo_description });
      this.meta.updateTag({ property: 'og:description', content: pageData.seo_description });
    }

    if (pageData.seo_keywords) {
      this.meta.updateTag({ name: 'keywords', content: pageData.seo_keywords });
    }

    if (pageData.seo_image) {
      this.meta.updateTag({ property: 'og:image', content: pageData.seo_image });
    }

    if (pageData.meta_robots) {
      this.meta.updateTag({ name: 'robots', content: pageData.meta_robots });
    }
  }
  setFavicon(iconUrl: string | undefined) {
    if (!iconUrl) return;

    let link: HTMLLinkElement = this.document.querySelector("link[rel~='icon']") as HTMLLinkElement;

    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'icon';
      this.document.head.appendChild(link);
    }
    link.href = iconUrl;
  }
  setCanonicalUrl(path: string) {
    let link: HTMLLinkElement = this.document.querySelector(
      "link[rel='canonical']",
    ) as HTMLLinkElement;
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = `https://littlepumpkindesign.de${path}`;
  }
}
