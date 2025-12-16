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
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("articles")
      .select("*", { count: "exact" })
      .order("published_at", { ascending: false })
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
      data: (data as any[]).map((row) => ({
        id: (row as any).id,
        slug: (row as any).slug,
        title: (row as any).title,
        summary: (row as any).summary ?? "",
        category: (row as any).category,
        tags: [],
        reading_time_minutes: (row as any).reading_time_minutes ?? 0,
        published_at: (row as any).published_at,
        cover_image_url: null,
        author: null,
        status: (row as any).status as ArticleSummary["status"],
        featured: (row as any).featured ?? false,
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
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("articles").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: (data as any).id,
      slug: (data as any).slug,
      title: (data as any).title,
      summary: (data as any).summary ?? "",
      body_markdown: (data as any).body_markdown ?? "",
      category: (data as any).category,
      tags: [],
      reading_time_minutes: (data as any).reading_time_minutes ?? 0,
      word_count: (data as any).word_count ?? 0,
      published_at: (data as any).published_at,
      cover_image_url: null,
      author: null,
      references: [],
      images: [],
      like_count: 0,
      dislike_count: 0,
      status: (data as any).status as ArticleSummary["status"],
      featured: (data as any).featured ?? false,
    };
  } catch (error) {
    console.error("Falling back to mock article", error);
    return mockArticles.find((a) => a.slug === slug) ?? null;
  }
}

export async function getFeaturedArticle(): Promise<ArticleSummary | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .eq("featured", true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: (data as any).id,
      slug: (data as any).slug,
      title: (data as any).title,
      summary: (data as any).summary ?? "",
      category: (data as any).category,
      tags: [],
      reading_time_minutes: (data as any).reading_time_minutes ?? 0,
      published_at: (data as any).published_at,
      cover_image_url: null,
      author: null,
      status: (data as any).status as ArticleSummary["status"],
      featured: true,
    };
  } catch (error) {
    console.error("Error fetching featured article", error);
    return null;
  }
}
