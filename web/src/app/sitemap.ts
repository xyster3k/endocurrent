import { MetadataRoute } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BASE_URL = "https://nexusmednews.com";

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

  // Fetch all published articles
  let articlePages: MetadataRoute.Sitemap = [];
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = await createSupabaseServerClient();
      const { data: articles } = await supabase
        .from("articles")
        .select("slug, updated_at, published_at, category")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (articles) {
        articlePages = articles.map((article: any) => ({
          url: `${BASE_URL}/articles/${article.slug}`,
          lastModified: new Date(article.updated_at || article.published_at),
          changeFrequency: "weekly" as const,
          priority: 0.9,
        }));
      }
    }
  } catch (error) {
    console.error("Error fetching articles for sitemap:", error);
  }

  // Fetch unique categories for category pages
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = await createSupabaseServerClient();
      const { data: articles } = await supabase
        .from("articles")
        .select("category")
        .eq("status", "published")
        .not("category", "is", null);

      if (articles) {
        const uniqueCategories = [...new Set(articles.map((a: any) => a.category).filter(Boolean))];
        categoryPages = uniqueCategories.map((category) => ({
          url: `${BASE_URL}/category/${encodeURIComponent(category.toLowerCase())}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }));
      }
    }
  } catch (error) {
    console.error("Error fetching categories for sitemap:", error);
  }

  return [...staticPages, ...articlePages, ...categoryPages];
}
