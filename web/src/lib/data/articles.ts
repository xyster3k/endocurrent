import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ArticleDetail, ArticleSummary } from "@/lib/types";
import { mapToSummary, mockArticles } from "@/lib/data/mock-articles";

export type ArticleFilters = {
  page?: number;
  pageSize?: number;
  tag?: string;
  category?: string;
  search?: string;
  status?: "draft" | "draft_ai" | "published" | "archived";
  includeDrafts?: boolean;
};

export async function getArticles(
  filters: ArticleFilters = {}
): Promise<{ data: ArticleSummary[]; meta: { page: number; pageSize: number; total: number } }> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;

  // Fallback to mock data when Supabase isn't configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const published = mockArticles.filter((a) =>
      filters.includeDrafts ? true : a.status !== "draft" && a.status !== "draft_ai"
    );
    return {
      data: published.slice((page - 1) * pageSize, page * pageSize).map(mapToSummary),
      meta: { page, pageSize, total: published.length },
    };
  }

  try {
    const supabase = createSupabaseServerClient();
    let query = supabase
      .from("articles")
      .select("*", { count: "exact" })
      .order("published_at", { ascending: false, nullsLast: true })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (!filters.includeDrafts) {
      query = query.eq("status", "published");
    } else if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.search) query = query.textSearch("title", filters.search);

    const { data, error, count } = await query;
    if (error || !data) throw error;

    return {
      data: data.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        summary: row.summary ?? "",
        category: row.category,
        tags: [],
        reading_time_minutes: row.reading_time_minutes ?? 0,
        published_at: row.published_at,
        cover_image_url: null,
        author: null,
        status: row.status as ArticleSummary["status"],
      })),
      meta: { page, pageSize, total: count ?? data.length },
    };
  } catch (error) {
    console.error("Falling back to mock articles", error);
    const published = mockArticles.filter((a) =>
      filters.includeDrafts ? true : a.status !== "draft" && a.status !== "draft_ai"
    );
    return {
      data: published.slice((page - 1) * pageSize, page * pageSize).map(mapToSummary),
      meta: { page, pageSize, total: published.length },
    };
  }
}

export async function getArticleBySlug(slug: string): Promise<ArticleDetail | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return mockArticles.find((a) => a.slug === slug) ?? null;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      slug: data.slug,
      title: data.title,
      summary: data.summary ?? "",
      body_markdown: data.body_markdown,
      category: data.category,
      tags: [],
      reading_time_minutes: data.reading_time_minutes ?? 0,
      word_count: data.word_count ?? 0,
      published_at: data.published_at,
      cover_image_url: null,
      author: null,
      references: [],
      images: [],
      like_count: 0,
      dislike_count: 0,
      status: data.status as ArticleSummary["status"],
    };
  } catch (error) {
    console.error("Falling back to mock article", error);
    return mockArticles.find((a) => a.slug === slug) ?? null;
  }
}
