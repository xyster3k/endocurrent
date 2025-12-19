import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

type Params = Promise<{ id: string }>;

export async function POST(req: NextRequest, props: { params: Params }) {
  const params = await props.params;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ ok: true, message: "Supabase not configured; share tracking skipped." });
  }

  // Get user ID if authenticated (optional for shares)
  let userId: string | null = null;
  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch {
    // User not authenticated, continue anyway
  }

  // Use service role to bypass RLS
  const supabase = await createSupabaseServerClient({ useServiceRole: true });

  // Track individual share
  const shares = (supabase as any).from("article_shares");
  const { error: shareError } = await shares.insert({
    article_id: params.id,
    user_id: userId,
    shared_at: new Date().toISOString(),
  });

  if (shareError) {
    console.error("Error tracking share:", shareError);
    // Don't fail the request if tracking fails
  }

  return NextResponse.json({ ok: true });
}
