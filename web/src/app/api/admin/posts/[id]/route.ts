import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockArticles } from "@/lib/data/mock-articles";
import { estimateReadingTime } from "@/lib/reading-time";

export const runtime = "edge";

const updateSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  body_markdown: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["draft", "draft_ai", "published", "archived"]).optional(),
  tags: z.array(z.string()).optional(),
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

  const supabase = createSupabaseServerClient({ useServiceRole: true });
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
  // Never write a non-UUID author_id (Clerk ids are not UUIDs).
  if (updates.author_id && typeof updates.author_id === "string" && !/^[0-9a-fA-F-]{36}$/.test(updates.author_id)) {
    delete updates.author_id;
  }

  const supabase = createSupabaseServerClient({ useServiceRole: true });
  const { error } = await supabase.from("articles").update(updates).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE(_req: Request, props: { params: Params }) {
  const params = await props.params;
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, message: "Supabase not configured; mock delete only." });
  }

  const supabase = createSupabaseServerClient({ useServiceRole: true });
  const { error } = await supabase.from("articles").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 200 });
}
