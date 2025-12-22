import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockArticles } from "@/lib/data/mock-articles";
import { estimateReadingTime } from "@/lib/reading-time";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nexusmednews.com";

// Ping Google to re-crawl sitemap when new content is published
async function pingGoogleSitemap() {
  try {
    const sitemapUrl = encodeURIComponent(`${SITE_URL}/sitemap.xml`);
    await fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`, {
      method: "GET",
    });
  } catch {
    // Silently fail - this is a nice-to-have, not critical
  }
}

const updateSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  body_markdown: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["draft", "draft_ai", "published", "archived"]).optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
});

type Params = Promise<{ id: string }>;

export async function GET(_req: Request, props: { params: Params }) {
  const params = await props.params;
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const post = mockArticles.find((a) => a.id === params.id);
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: post }, { status: 200 });
  }

  const supabase = await createSupabaseServerClient({ useServiceRole: true });
  const { data, error } = await supabase.from("articles").select("*").eq("id", params.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data }, { status: 200 });
}

export async function PUT(req: Request, props: { params: Params }) {
  const params = await props.params;
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, message: "Supabase not configured; mock update only." });
  }

  const { tags, ...rest } = parsed.data;
  const updates: Record<string, unknown> = { ...rest };
  if (parsed.data.body_markdown) {
    const reading = estimateReadingTime(parsed.data.body_markdown);
    updates.reading_time_minutes = reading.minutes;
    updates.word_count = reading.words;
  }
  // If status is set to published and no published_at provided, stamp now.
  if (parsed.data.status === "published" && !("published_at" in updates)) {
    updates.published_at = new Date().toISOString();
  }

  const supabase = await createSupabaseServerClient({ useServiceRole: true });

  // If setting featured to true, unflag all other articles first
  if (parsed.data.featured === true) {
    await supabase
      .from("articles")
      .update({ featured: false })
      .neq("id", params.id);
  }

  // If publishing and article doesn't have an author_id, set it to current user
  if (parsed.data.status === "published") {
    const { data: article } = await supabase.from("articles").select("author_id").eq("id", params.id).maybeSingle();
    if (article && !article.author_id) {
      updates.author_id = user?.id ?? null;
    }
  }

  const { error } = await supabase.from("articles").update(updates).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Ping Google when article is published to trigger sitemap re-crawl
  if (parsed.data.status === "published") {
    pingGoogleSitemap();
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE(_req: Request, props: { params: Params }) {
  const params = await props.params;
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, message: "Supabase not configured; mock delete only." });
  }

  const supabase = await createSupabaseServerClient({ useServiceRole: true });
  const { error } = await supabase.from("articles").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 200 });
}
