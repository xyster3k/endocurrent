import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser, requireRole } from "@/lib/auth";
import { estimateReadingTime } from "@/lib/reading-time";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getArticles } from "@/lib/data/articles";


const bodySchema = z.object({
  title: z.string(),
  slug: z.string(),
  summary: z.string().optional(),
  body_markdown: z.string().default(""),
  category: z.string().optional(),
  cover_image_url: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "draft_ai", "published", "archived"]).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);
  const status = searchParams.get("status") as "draft" | "draft_ai" | "published" | "archived" | undefined;
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search") || undefined;

  try {
    const result = await getArticles({
      page,
      pageSize,
      status,
      category,
      search,
      includeDrafts: true,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch articles", details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);

  const contentType = req.headers.get("content-type") || "";
  const payload =
    contentType.includes("application/json")
      ? await req.json()
      : Object.fromEntries(await req.formData());
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data.body_markdown ?? "";
  const reading = estimateReadingTime(body);
  const status = parsed.data.status ?? "draft";

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      ok: true,
      message: "Supabase not configured; returning mock response.",
      data: { ...parsed.data, status, reading_time_minutes: reading.minutes },
    });
  }

  const supabase = await createSupabaseServerClient({ useServiceRole: true });
  const articles = (supabase as any).from("articles");
  const { data, error } = await articles
    .insert({
      title: parsed.data.title,
      slug: parsed.data.slug,
      summary: parsed.data.summary ?? "",
      body_markdown: body,
      category: parsed.data.category ?? null,
      cover_image_url: parsed.data.cover_image_url ?? null,
      tags: parsed.data.tags ?? [],
      status,
      reading_time_minutes: reading.minutes,
      word_count: reading.words,
      author_id: user?.id ?? null,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
