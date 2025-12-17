import type { ArticleDetail, ArticleSummary } from "@/lib/types";

// No mock articles - use real data from database only
const baseArticles: ArticleDetail[] = [];

export const mockArticles: ArticleDetail[] = baseArticles;

export function mapToSummary(a: ArticleDetail): ArticleSummary {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    summary: a.summary,
    category: a.category,
    tags: a.tags,
    reading_time_minutes: a.reading_time_minutes,
    published_at: a.published_at,
    cover_image_url: a.cover_image_url,
    author: a.author,
  };
}
