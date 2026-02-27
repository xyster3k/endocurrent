import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendReportEmail } from "@/lib/email";


type Params = Promise<{ id: string }>;

export async function POST(req: NextRequest, props: { params: Params }) {
  const params = await props.params;

  // Get user if authenticated (optional for reports)
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

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

  // Use service role so reports are recorded even with RLS enabled
  const adminSupabase = await createSupabaseServerClient({ useServiceRole: true });
  const reports = (adminSupabase as any).from("article_reports");
  const { error } = await reports.insert({
    article_id: params.id,
    user_id: userId,
    reason_code,
    comment,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch article details for email notification
  const articles = (adminSupabase as any).from("articles");
  const { data: article, error: articleError } = await articles
    .select("title, slug")
    .eq("id", params.id)
    .maybeSingle();

  if (!articleError && article) {
    // Get reporter email from Supabase auth user
    const reporterEmail = user?.email ?? null;

    // Send email notification
    await sendReportEmail({
      articleId: params.id,
      articleTitle: article.title,
      articleSlug: article.slug,
      reasonCode: reason_code,
      comment,
      reporterUserId: userId,
      reporterEmail,
    });
  }

  return NextResponse.json({ ok: true });
}
