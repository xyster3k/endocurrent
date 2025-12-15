import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { estimateReadingTime } from "@/lib/reading-time";
import { mockArticles } from "@/lib/data/mock-articles";

export const runtime = "edge";

const postSchema = z.object({
  title: z.string().min(2),
  slug: z.string().min(2),
  summary: z.string().default(""),
  body_markdown: z.string().default(""),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "draft_ai", "published", "archived"]).default("draft"),
});

export async function GET() {
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ data: mockArticles }, { status: 200 });
  }

  const supabase = createSupabaseServerClient({ useServiceRole: true });
  const { data, error } = await supabase.from("articles").select("*").order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);

  const payload = await req.json();
  const parsed = postSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const reading = estimateReadingTime(parsed.data.body_markdown || "");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      ok: true,
      message: "Supabase not configured; mock create only",
      data: { ...parsed.data, reading_time_minutes: reading.minutes, word_count: reading.words },
    });
  }

  const supabase = createSupabaseServerClient({ useServiceRole: true });
  const { data, error } = await supabase
    .from("articles")
    .insert({
      title: parsed.data.title,
      slug: parsed.data.slug,
      summary: parsed.data.summary,
      body_markdown: parsed.data.body_markdown,
      category: parsed.data.category ?? null,
      status: parsed.data.status,
      reading_time_minutes: reading.minutes,
      word_count: reading.words,
      // Clerk user ids are not UUID; store author_id only if it is a valid UUID, else null.
      author_id: /^[0-9a-fA-F-]{36}$/.test(user?.id ?? "") ? (user!.id as any) : null,
    })
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data }, { status: 200 });
}
