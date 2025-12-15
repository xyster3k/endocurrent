import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

type Params = Promise<{ id: string }>;

export async function POST(req: NextRequest, props: { params: Params }) {
  const params = await props.params;
  const { userId } = await auth();
  const body = await req.json();
  const reason_code = body?.reason_code;
  const comment = body?.comment ?? null;

  if (!["spam", "incorrect", "offensive", "other"].includes(reason_code)) {
    return NextResponse.json({ error: "Invalid reason_code" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({
      ok: true,
      message: "Supabase not configured; report accepted in mock mode.",
    });
  }

  const supabase = createSupabaseServerClient();
  const reports = (supabase as any).from("article_reports");
  const { error } = await reports.insert({
    article_id: params.id,
    user_id: userId ?? null,
    reason_code,
    comment,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
