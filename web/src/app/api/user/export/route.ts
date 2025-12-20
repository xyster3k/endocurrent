import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "Unable to fetch user data" }, { status: 500 });
  }

  // Compile user data from Clerk
  const userData: Record<string, unknown> = {
    exportDate: new Date().toISOString(),
    account: {
      id: clerkUser.id,
      createdAt: clerkUser.createdAt,
      updatedAt: clerkUser.updatedAt,
      emailAddresses: clerkUser.emailAddresses.map((e) => ({
        email: e.emailAddress,
        verified: e.verification?.status === "verified",
      })),
      primaryEmailId: clerkUser.primaryEmailAddressId,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      username: clerkUser.username,
      imageUrl: clerkUser.imageUrl,
      publicMetadata: clerkUser.publicMetadata,
    },
  };

  // Fetch Supabase data if configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createSupabaseServerClient({ useServiceRole: true });

      // Fetch profile
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profile) {
        userData.profile = profile;
      }

      // Fetch subscriptions
      const { data: subscriptions } = await (supabase as any)
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId);

      if (subscriptions && subscriptions.length > 0) {
        userData.subscriptions = subscriptions;
      }

      // Fetch article likes
      const { data: likes } = await (supabase as any)
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
      const { data: reports } = await (supabase as any)
        .from("article_reports")
        .select("article_id, reason_code, comment, created_at")
        .eq("user_id", userId);

      if (reports && reports.length > 0) {
        userData.submittedReports = reports;
      }

      // Fetch articles authored by user (if any)
      const { data: authoredArticles } = await (supabase as any)
        .from("articles")
        .select("id, slug, title, status, created_at, published_at")
        .eq("author_id", userId);

      if (authoredArticles && authoredArticles.length > 0) {
        userData.authoredArticles = authoredArticles;
      }
    } catch (error) {
      console.error("Error fetching Supabase data:", error);
      userData.supabaseDataError = "Some data could not be retrieved";
    }
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
