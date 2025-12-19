import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";


type Params = Promise<{ id: string }>;

export async function POST(req: NextRequest, props: { params: Params }) {
  const params = await props.params;

  // Check authentication
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json();
  const value = body?.value;
  if (value !== 1 && value !== -1) {
    return NextResponse.json({ error: "value must be 1 or -1" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ ok: true, message: "Supabase not configured; like skipped." });
  }

  // Use service role so RLS policies do not block likes (auth is enforced via Clerk above)
  const supabase = await createSupabaseServerClient({ useServiceRole: true });
  const likes = (supabase as any).from("article_likes");
  const { error } = await likes.upsert({ article_id: params.id, user_id: userId, value }, { onConflict: "article_id,user_id" });
  if (error) {
    console.error("Like error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
