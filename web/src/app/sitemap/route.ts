import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BASE_URL = "https://nexusmednews.com";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET() {
  const staticPages = [
    { url: BASE_URL, lastmod: new Date().toISOString(), changefreq: "daily", priority: "1.0" },
    { url: `${BASE_URL}/about`, lastmod: new Date().toISOString(), changefreq: "monthly", priority: "0.8" },
    { url: `${BASE_URL}/contact`, lastmod: new Date().toISOString(), changefreq: "monthly", priority: "0.5" },
  ];

  const supabase = getSupabaseClient();
  let articlePages: { url: string; lastmod: string; changefreq: string; priority: string }[] = [];
  let categoryPages: { url: string; lastmod: string; changefreq: string; priority: string }[] = [];

  if (supabase) {
    try {
      const { data: articles } = await supabase
        .from("articles")
        .select("slug, updated_at, published_at, category")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (articles) {
        articlePages = articles.map((article) => ({
          url: `${BASE_URL}/articles/${article.slug}`,
          lastmod: new Date(article.updated_at || article.published_at).toISOString(),
          changefreq: "weekly",
          priority: "0.9",
        }));

        const uniqueCategories = [...new Set(articles.map((a) => a.category as string).filter(Boolean))];
        categoryPages = uniqueCategories.map((category) => ({
          url: `${BASE_URL}/category/${encodeURIComponent(category.toLowerCase())}`,
          lastmod: new Date().toISOString(),
          changefreq: "weekly",
          priority: "0.7",
        }));
      }
    } catch (error) {
      console.error("Error fetching articles for sitemap:", error);
    }
  }

  const allPages = [...staticPages, ...articlePages, ...categoryPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
