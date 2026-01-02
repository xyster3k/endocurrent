import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ArticleDetail, ArticleSummary, ArticleAuthor } from "@/lib/types";
import { mapToSummary, mockArticles } from "@/lib/data/mock-articles";

async function getAuthorInfo(authorId: string | null): Promise<ArticleAuthor | null> {
  if (!authorId) return null;

  try {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) return null;

    const response = await fetch(`https://api.clerk.com/v1/users/${authorId}`, {
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const userData = await response.json();

    // Try display_name from publicMetadata first, fall back to email username
    const displayName = userData.public_metadata?.display_name;
    const email = userData.email_addresses?.[0]?.email_address;
    const name = displayName || (email ? email.split('@')[0] : null);

    if (!name) return null;

    return {
      id: authorId,
      name,
      affiliation: null,
    };
  } catch (error) {
    console.error('Error fetching author info:', error);
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
