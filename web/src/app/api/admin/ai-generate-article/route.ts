import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { estimateReadingTime } from "@/lib/reading-time";
import { env } from "@/lib/env";
import type { Database } from "@/db/types";


const schema = z.object({
  topic: z.string(),
  scope: z.string().optional(),
  sources: z.union([z.array(z.string()), z.string()]).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);

  const contentType = req.headers.get("content-type") || "";
  const payload =
    contentType.includes("application/json")
      ? await req.json()
      : Object.fromEntries(await req.formData());

  const parsed = schema.safeParse({
    ...payload,
    sources:
      typeof payload.sources === "string"
        ? (payload.sources as string).split(/\r?\n/).filter(Boolean)
        : payload.sources,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!env.AI_DRAFT_API_URL || !env.AI_DRAFT_API_KEY) {
    return NextResponse.json({
      ok: true,
      message: "AI endpoint not configured; returning echo payload.",
      data: parsed.data,
    });
  }

  const aiResponse = await fetch(env.AI_DRAFT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.AI_DRAFT_API_KEY}`,
    },
    body: JSON.stringify(parsed.data),
  });

  if (!aiResponse.ok) {
    return NextResponse.json(
      { error: "AI provider returned an error", status: aiResponse.status },
      { status: 502 }
    );
  }

  const draft = await aiResponse.json();
  const body_markdown = draft.body_markdown || draft.body || "";
  const summary = draft.summary || "";
  const title = draft.title || parsed.data.topic;
  const reading = estimateReadingTime(body_markdown);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({
      ok: true,
      message: "Supabase not configured; returning AI payload only.",
      data: { title, summary, body_markdown },
    });
  }

  const supabase = await createSupabaseServerClient({ useServiceRole: true });
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  const draftPayload = {
    title,
    slug,
    summary,
    body_markdown,
    status: "draft_ai",
    reading_time_minutes: reading.minutes,
    word_count: reading.words,
    author_id: /^[0-9a-fA-F-]{36}$/.test(user?.id ?? "") ? user?.id : null,
  };

  const { data, error } = await supabase.from("articles").insert([draftPayload] as any).select().maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data });
}
