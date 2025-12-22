# Web Application

Next.js 15 (App Router) web application. See the main [README](../README.md) in the project root for full documentation.

## Quick Start

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
# Production build
npm run build

# Cloudflare Pages
npm run build:cloudflare
```

## Directory Structure

```
src/
├── app/          # Routes and pages
├── components/   # React components
├── lib/          # Utilities and data fetching
└── db/           # Database types
```

## SEO Configuration

The site includes comprehensive SEO optimizations for search engine visibility.

### Dynamic Sitemap

The sitemap is dynamically generated at `/sitemap` and includes:
- Static pages (home, about, contact)
- All published articles
- All category pages

**File:** `src/app/sitemap/route.ts`

```typescript
// The sitemap uses force-dynamic to always fetch fresh data
export const dynamic = "force-dynamic";

// Fetches articles from Supabase and generates XML
export async function GET() {
  // ... fetches articles and categories
  return new Response(xml, {
    headers: { "Content-Type": "application/xml" }
  });
}
```

**Note:** The route is `/sitemap` (not `/sitemap.xml`) to avoid Cloudflare Pages intercepting the request with their Content Signals feature.

### Robots.txt

Static file at `public/robots.txt`:
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /sign-in
Disallow: /sign-up

Sitemap: https://nexusmednews.com/sitemap
```

### RSS Feed

Available at `/feed.xml` - automatically includes the 50 most recent articles.

**File:** `src/app/feed.xml/route.ts`

### JSON-LD Structured Data

The site includes structured data for better search engine understanding:

**Organization & Website Schema** (in `src/app/layout.tsx`):
- Organization schema with logo, social links
- WebSite schema with search action

**Article Schema** (in `src/app/articles/[slug]/page.tsx`):
- NewsArticle schema for each article
- BreadcrumbList for navigation

**Category Schema** (in `src/app/category/[slug]/page.tsx`):
- BreadcrumbList for category pages

**Schema definitions:** `src/lib/seo.ts`

### Google Sitemap Ping

When an article is published, Google is automatically pinged to re-crawl the sitemap:

**File:** `src/app/api/admin/posts/[id]/route.ts`

```typescript
async function pingGoogleSitemap() {
  const sitemapUrl = encodeURIComponent(`${SITE_URL}/sitemap`);
  await fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`);
}
```

### Meta Tags

Meta tags are configured per-page using Next.js Metadata API:
- Open Graph tags for social sharing
- Twitter Card tags
- Canonical URLs
- Article-specific metadata (publish date, author)

**Root metadata:** `src/app/layout.tsx`

### Adding to Google Search Console

1. Verify domain ownership in [Google Search Console](https://search.google.com/search-console)
2. Submit sitemap URL: `https://nexusmednews.com/sitemap`
3. The sitemap will auto-update when articles are published
