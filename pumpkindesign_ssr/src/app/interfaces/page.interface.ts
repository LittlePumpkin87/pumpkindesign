export interface PageData {
  title: string;
  SEO_description: string;
  SEO_keywords: string[];
  SEO_image: string;
  meta_robots: string;
  content: Record<string, unknown>;
}
