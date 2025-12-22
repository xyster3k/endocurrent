import type { ArticleSummary } from "@/lib/types";
import { env } from "@/lib/env";

const BASE_URL = env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://nexusmednews.com";

// Organization schema for the site
export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "Nexus Med News",
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/logo.png`,
      width: 512,
      height: 512,
    },
    description: "Curated medical intelligence. Stay current with medical news, peer-reviewed research summaries, and expert insights.",
    sameAs: [],
  };
}

// WebSite schema for search engines
export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    name: "Nexus Med News",
    url: BASE_URL,
    publisher: {
      "@id": `${BASE_URL}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// NewsArticle schema (better for news sites than BlogPosting)
export function buildArticleJsonLd(article: ArticleSummary) {
  const url = `${BASE_URL}/articles/${article.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${url}#article`,
    headline: article.title,
    description: article.summary,
    datePublished: article.published_at,
    dateModified: article.published_at,
    author: {
      "@type": "Person",
      name: article.author?.name ?? "Editorial Team",
    },
    publisher: {
      "@id": `${BASE_URL}/#organization`,
    },
    image: article.cover_image_url ? {
      "@type": "ImageObject",
      url: article.cover_image_url,
    } : undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    url,
    articleSection: article.category,
    keywords: article.tags?.join(", "),
  };
}

// Breadcrumb schema for better navigation in SERPs
export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
}

// Helper to build article page breadcrumbs
export function buildArticleBreadcrumbs(article: ArticleSummary) {
  const items = [
    { name: "Home", url: "/" },
  ];

  if (article.category) {
    items.push({
      name: article.category,
      url: `/category/${article.category.toLowerCase()}`,
    });
  }

  items.push({
    name: article.title,
    url: `/articles/${article.slug}`,
  });

  return buildBreadcrumbJsonLd(items);
}

// Helper to build category page breadcrumbs
export function buildCategoryBreadcrumbs(categoryName: string, categorySlug: string) {
  return buildBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: categoryName, url: `/category/${categorySlug}` },
  ]);
}
