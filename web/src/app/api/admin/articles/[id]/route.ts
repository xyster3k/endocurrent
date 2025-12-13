import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { estimateReadingTime } from "@/lib/reading-time";

export const runtime = "edge";

const updateSchema = z.object({
  title: z.string().optional(),
  summary: z.string().optional(),
  body_markdown: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["draft", "draft_ai", "published", "archived"]).optional(),
});

type Params = Promise<{ id: string }>;

export async function PUT(req: NextRequest, props: { params: Params }) {
  const params = await props.params;
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);

  const payload = await req.json();
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, message: "Supabase not configured; update skipped." });
  }

  const supabase = createSupabaseServerClient({ useServiceRole: true });
  const updates: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.body_markdown) {
    const reading = estimateReadingTime(parsed.data.body_markdown);
    updates.reading_time_minutes = reading.minutes;
    updates.word_count = reading.words;
  }

  const { error } = await supabase.from("articles").update(updates).eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
