import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BASE_URL = "https://nexusmednews.com";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const supabase = getSupabaseClient();
  if (!supabase) {
    return staticPages;
  }

  // Fetch all published articles
  let articlePages: MetadataRoute.Sitemap = [];
  try {
    const { data: articles } = await supabase
      .from("articles")
      .select("slug, updated_at, published_at, category")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (articles) {
      articlePages = articles.map((article) => ({
        url: `${BASE_URL}/articles/${article.slug}`,
        lastModified: new Date(article.updated_at || article.published_at),
        changeFrequency: "weekly" as const,
        priority: 0.9,
      }));
    }
  } catch (error) {
    console.error("Error fetching articles for sitemap:", error);
  }

  // Fetch unique categories for category pages
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const { data: articles } = await supabase
      .from("articles")
      .select("category")
      .eq("status", "published")
      .not("category", "is", null);

    if (articles) {
      const uniqueCategories = [...new Set(articles.map((a) => a.category as string).filter(Boolean))];
      categoryPages = uniqueCategories.map((category) => ({
        url: `${BASE_URL}/category/${encodeURIComponent(category.toLowerCase())}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error("Error fetching categories for sitemap:", error);
  }

  return [...staticPages, ...articlePages, ...categoryPages];
}
