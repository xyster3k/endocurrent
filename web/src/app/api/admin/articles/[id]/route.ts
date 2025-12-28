import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser, requireRole } from "@/lib/auth";
import { estimateReadingTime } from "@/lib/reading-time";
import { createSupabaseServerClient } from "@/lib/supabase/server";


const bodySchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  body_markdown: z.string().optional(),
  category: z.string().optional().nullable(),
  cover_image_url: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "draft_ai", "published", "archived"]).optional(),
  featured: z.boolean().optional(),
});

type Params = Promise<{ id: string }>;

export async function GET(_req: NextRequest, props: { params: Params }) {
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);
  const params = await props.params;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const supabase = await createSupabaseServerClient({ useServiceRole: true });
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Article not found" }, { status: 404 });

  return NextResponse.json({ ok: true, data });
}

export async function PUT(req: NextRequest, props: { params: Params }) {
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);
  const params = await props.params;

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data.body_markdown ?? "";
  const reading = estimateReadingTime(body);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      ok: true,
      message: "Supabase not configured; mock update.",
      data: { ...parsed.data, reading_time_minutes: reading.minutes },
    });
  }

  const supabase = await createSupabaseServerClient({ useServiceRole: true });
  const articles = (supabase as any).from("articles");

  // Build update object
  const updateData: Record<string, unknown> = {
    ...parsed.data,
    reading_time_minutes: reading.minutes,
    word_count: reading.words,
  };

  // Set published_at when status changes to published
  if (parsed.data.status === "published") {
    const { data: existing } = await articles.select("published_at").eq("id", params.id).maybeSingle();
    if (!existing?.published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await articles
    .update(updateData)
    .eq("id", params.id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

export async function DELETE(_req: NextRequest, props: { params: Params }) {
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);
  const params = await props.params;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, message: "Supabase not configured; mock delete." });
  }

  const supabase = await createSupabaseServerClient({ useServiceRole: true });
  const { error } = await supabase.from("articles").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
