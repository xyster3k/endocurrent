import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

type Params = Promise<{ id: string }>;

export async function POST(_req: NextRequest, props: { params: Params }) {
  const params = await props.params;
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, message: "Supabase not configured; unpublish skipped." });
  }

  const supabase = await createSupabaseServerClient({ useServiceRole: true });
  const articles = (supabase as any).from("articles");
  const { error } = await articles
    .update({
      status: "draft",
      published_at: null,
    })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
