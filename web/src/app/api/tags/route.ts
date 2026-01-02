import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Return mock data when Supabase isn't configured
    return NextResponse.json({
      data: [
        { tag: "diabetes", count: 5 },
        { tag: "thyroid", count: 4 },
        { tag: "obesity", count: 3 },
        { tag: "endocrinology", count: 6 },
        { tag: "hormone", count: 2 },
      ],
    });
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Get all published articles with their tags
    const { data: articles, error } = await (supabase as any)
      .from("articles")
      .select("tags")
      .eq("status", "published");

    if (error) throw error;

    // Count tag occurrences
    const tagCounts: Record<string, number> = {};

    for (const article of (articles || []) as { tags: string[] | null }[]) {
      const tags = article.tags;
      if (tags && Array.isArray(tags)) {
        for (const tag of tags) {
          const normalizedTag = tag.toLowerCase().trim();
          if (normalizedTag) {
            tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
          }
        }
      }
    }

    // Convert to array and sort by count (descending)
    const tagsArray = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ data: tagsArray });
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}
