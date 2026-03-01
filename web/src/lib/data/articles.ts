import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ArticleDetail, ArticleSummary, ArticleAuthor, Category } from "@/lib/types";
import { mapToSummary, mockArticles } from "@/lib/data/mock-articles";

async function getAuthorInfo(authorId: string | null): Promise<ArticleAuthor | null> {
  if (!authorId) return null;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const supabase = await createSupabaseServerClient({ useServiceRole: true });
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, affiliation")
      .eq("id", authorId)
      .maybeSingle();

    const name = (profile as any)?.display_name;
    if (!name) return null;

    return {
      id: authorId,
      name,
      affiliation: (profile as any)?.affiliation ?? null,
    };
  } catch (error) {
    console.error("Error fetching author info:", error);
    return null;
  }
}

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
    // Use service role when fetching drafts (admin context)
    const useServiceRole = filters.includeDrafts || filters.status === "draft" || filters.status === "draft_ai";
    const supabase = await createSupabaseServerClient({ useServiceRole });
    let query = supabase
      .from("articles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (!filters.includeDrafts) {
      query = query.eq("status", "published");
    } else if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.category) query = query.ilike("category", filters.category);
    if (filters.tag) {
      // Filter by tag - tags is a PostgreSQL array, use contains
      query = query.contains("tags", [filters.tag]);
    }
    if (filters.search) {
      // Search across title, summary, and body using ilike for partial matches
      const searchTerm = `%${filters.search}%`;
      query = query.or(`title.ilike.${searchTerm},summary.ilike.${searchTerm},body_markdown.ilike.${searchTerm}`);
    }

    const { data, error, count } = await query;
    if (error || !data) throw error;

    // Fetch author information for all articles
    const articlesWithAuthors = await Promise.all(
      (data as any[]).map(async (row) => {
        const author = await getAuthorInfo((row as any).author_id);
        return {
          id: (row as any).id,
          slug: (row as any).slug,
          title: (row as any).title,
          summary: (row as any).summary ?? "",
          category: (row as any).category,
          tags: (row as any).tags ?? [],
          reading_time_minutes: (row as any).reading_time_minutes ?? 0,
          published_at: (row as any).published_at,
          cover_image_url: (row as any).cover_image_url ?? null,
          author,
          status: (row as any).status as ArticleSummary["status"],
          featured: (row as any).featured ?? false,
        };
      })
    );

    return {
      data: articlesWithAuthors,
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

export async function getCategories(): Promise<Category[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("order_index", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Category[];
  } catch {
    return [];
  }
}

/**
 * Build a mapping from subcategory → parent category using menu_items.
 * E.g. "Diabetes" → "Endocrinology", "AI" → "Medical AI"
 */
async function getSubcategoryToParentMap(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return map;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: items, error } = await supabase
      .from("menu_items")
      .select("id, label, category, parent_id");
    if (error || !items) return map;

    // Build id → item lookup
    const byId: Record<string, { label: string; category: string | null; parent_id: string | null }> = {};
    for (const item of items as any[]) {
      byId[item.id] = { label: item.label, category: item.category, parent_id: item.parent_id };
    }

    // For each child item (has parent_id), map its category to the parent's label
    for (const item of items as any[]) {
      if (item.parent_id && item.category) {
        const parent = byId[item.parent_id];
        if (parent) {
          // Map subcategory name → parent label (case-insensitive lookup later)
          map[item.category.toLowerCase()] = parent.label;
        }
      }
    }
  } catch {
    // Silently fall back to no mapping
  }

  return map;
}

export async function getArticlesGroupedByCategory(
  maxPerCategory = 4
): Promise<Record<string, ArticleSummary[]>> {
  const [{ data: articles }, subcatMap] = await Promise.all([
    getArticles({ pageSize: 100 }),
    getSubcategoryToParentMap(),
  ]);

  const grouped: Record<string, ArticleSummary[]> = {};
  for (const article of articles) {
    const rawCat = article.category || "General";
    // Map subcategory to parent category if mapping exists
    const cat = subcatMap[rawCat.toLowerCase()] || rawCat;
    if (!grouped[cat]) grouped[cat] = [];
    if (grouped[cat].length < maxPerCategory) {
      grouped[cat].push(article);
    }
  }

  return grouped;
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

    // Fetch like counts from article_likes table
    let like_count = 0;
    let dislike_count = 0;
    try {
      const { data: likesData } = await supabase
        .from("article_likes")
        .select("value")
        .eq("article_id", (data as any).id);

      if (likesData) {
        like_count = likesData.filter((l: any) => l.value === 1).length;
        dislike_count = likesData.filter((l: any) => l.value === -1).length;
      }
    } catch (likesError) {
      console.error("Error fetching likes:", likesError);
    }

    return {
      id: (data as any).id,
      slug: (data as any).slug,
      title: (data as any).title,
      summary: (data as any).summary ?? "",
      body_markdown: (data as any).body_markdown ?? "",
      category: (data as any).category,
      tags: (data as any).tags ?? [],
      reading_time_minutes: (data as any).reading_time_minutes ?? 0,
      word_count: (data as any).word_count ?? 0,
      published_at: (data as any).published_at,
      cover_image_url: (data as any).cover_image_url ?? null,
      author: null,
      author_id: (data as any).author_id ?? null,
      references: [],
      images: [],
      like_count,
      dislike_count,
      status: (data as any).status as ArticleSummary["status"],
      featured: (data as any).featured ?? false,
    } as any;
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
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Fetch author information
    const author = await getAuthorInfo((data as any).author_id);

    return {
      id: (data as any).id,
      slug: (data as any).slug,
      title: (data as any).title,
      summary: (data as any).summary ?? "",
      category: (data as any).category,
      tags: (data as any).tags ?? [],
      reading_time_minutes: (data as any).reading_time_minutes ?? 0,
      published_at: (data as any).published_at,
      cover_image_url: (data as any).cover_image_url ?? null,
      author,
      status: (data as any).status as ArticleSummary["status"],
      featured: true,
    };
  } catch {
    // Featured article is optional - silently return null if not available
    return null;
  }
}
