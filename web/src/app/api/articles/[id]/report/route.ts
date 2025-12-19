import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendReportEmail } from "@/lib/email";


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

  // Use service role so reports are recorded even with RLS enabled
  const supabase = await createSupabaseServerClient({ useServiceRole: true });
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

  // Fetch article details for email notification
  const articles = (supabase as any).from("articles");
  const { data: article, error: articleError } = await articles
    .select("title, slug")
    .eq("id", params.id)
    .maybeSingle();

  if (!articleError && article) {
    // Optionally fetch reporter email from Clerk
    let reporterEmail: string | null = null;
    if (userId) {
      try {
        const clerkSecretKey = process.env.CLERK_SECRET_KEY;
        if (clerkSecretKey) {
          const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
            headers: {
              'Authorization': `Bearer ${clerkSecretKey}`,
            },
            cache: 'no-store',
          });

          if (response.ok) {
            const userData = await response.json();
            reporterEmail = userData.email_addresses?.[0]?.email_address ?? null;
          }
        }
      } catch (error) {
        console.error('Error fetching reporter email:', error);
      }
    }

    // Send email notification
    await sendReportEmail({
      articleId: params.id,
      articleTitle: article.title,
      articleSlug: article.slug,
      reasonCode: reason_code,
      comment,
      reporterUserId: userId ?? null,
      reporterEmail,
    });
  }

  return NextResponse.json({ ok: true });
}
