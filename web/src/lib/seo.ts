import type { ArticleSummary } from "@/lib/types";
import { env } from "@/lib/env";

export function buildArticleJsonLd(article: ArticleSummary) {
  const url = `${env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")}/articles/${article.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.summary,
    datePublished: article.published_at,
    author: {
      "@type": "Person",
      name: article.author?.name ?? "Editorial Team",
    },
    image: article.cover_image_url,
    url,
  };
}
