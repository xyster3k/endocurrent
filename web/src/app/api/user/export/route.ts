import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const userId = user.id;

  // Compile user data from Supabase Auth
  const userData: Record<string, unknown> = {
    exportDate: new Date().toISOString(),
    account: {
      id: user.id,
      createdAt: user.created_at,
      email: user.email,
      emailConfirmedAt: user.email_confirmed_at,
      lastSignInAt: user.last_sign_in_at,
    },
  };

  // Fetch Supabase data
  try {
    const adminSupabase = await createSupabaseServerClient({ useServiceRole: true });

    // Fetch profile
    const { data: profile } = await (adminSupabase as any)
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      userData.profile = profile;
    }

    // Fetch subscriptions
    const { data: subscriptions } = await (adminSupabase as any)
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (subscriptions && subscriptions.length > 0) {
      userData.subscriptions = subscriptions;
    }

    // Fetch article likes
    const { data: likes } = await (adminSupabase as any)
      .from("article_likes")
      .select("article_id, value")
      .eq("user_id", userId);

    if (likes && likes.length > 0) {
      userData.articleInteractions = (likes as { article_id: string; value: number }[]).map((l) => ({
        articleId: l.article_id,
        reaction: l.value === 1 ? "like" : "dislike",
      }));
    }

    // Fetch article reports submitted by user
    const { data: reports } = await (adminSupabase as any)
      .from("article_reports")
      .select("article_id, reason_code, comment, created_at")
      .eq("user_id", userId);

    if (reports && reports.length > 0) {
      userData.submittedReports = reports;
    }

    // Fetch articles authored by user (if any)
    const { data: authoredArticles } = await (adminSupabase as any)
      .from("articles")
      .select("id, slug, title, status, created_at, published_at")
      .eq("author_id", userId);

    if (authoredArticles && authoredArticles.length > 0) {
      userData.authoredArticles = authoredArticles;
    }
  } catch (error) {
    console.error("Error fetching Supabase data:", error);
    userData.dataError = "Some data could not be retrieved";
  }

  // Return as downloadable JSON
  return new NextResponse(JSON.stringify(userData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="user-data-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
