import { NextResponse, type NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Require confirmation in request body
  const body = await req.json().catch(() => ({}));
  if (body.confirm !== "DELETE_MY_ACCOUNT") {
    return NextResponse.json(
      { error: "Missing confirmation. Send { confirm: 'DELETE_MY_ACCOUNT' } to proceed." },
      { status: 400 }
    );
  }

  const deletedData: string[] = [];
  const errors: string[] = [];

  // Delete Supabase data if configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createSupabaseServerClient({ useServiceRole: true });

      // Delete article likes
      const { error: likesError } = await (supabase as any)
        .from("article_likes")
        .delete()
        .eq("user_id", userId);
      if (likesError) {
        errors.push(`article_likes: ${likesError.message}`);
      } else {
        deletedData.push("article_likes");
      }

      // Delete article reports
      const { error: reportsError } = await (supabase as any)
        .from("article_reports")
        .delete()
        .eq("user_id", userId);
      if (reportsError) {
        errors.push(`article_reports: ${reportsError.message}`);
      } else {
        deletedData.push("article_reports");
      }

      // Delete user subscriptions
      const { error: subsError } = await (supabase as any)
        .from("user_subscriptions")
        .delete()
        .eq("user_id", userId);
      if (subsError) {
        errors.push(`user_subscriptions: ${subsError.message}`);
      } else {
        deletedData.push("user_subscriptions");
      }

      // Delete profile
      const { error: profileError } = await (supabase as any)
        .from("profiles")
        .delete()
        .eq("id", userId);
      if (profileError) {
        errors.push(`profiles: ${profileError.message}`);
      } else {
        deletedData.push("profiles");
      }

      // Anonymize authored articles (don't delete them)
      const { error: articlesError } = await (supabase as any)
        .from("articles")
        .update({ author_id: null })
        .eq("author_id", userId);
      if (articlesError) {
        errors.push(`articles anonymization: ${articlesError.message}`);
      } else {
        deletedData.push("articles (anonymized)");
      }
    } catch (error) {
      errors.push(`Supabase error: ${String(error)}`);
    }
  }

  // Delete Clerk account
  try {
    const clerk = await clerkClient();
    await clerk.users.deleteUser(userId);
    deletedData.push("clerk_account");
  } catch (error) {
    errors.push(`Clerk deletion failed: ${String(error)}`);
  }

  if (errors.length > 0 && deletedData.length === 0) {
    return NextResponse.json(
      { error: "Account deletion failed", details: errors },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Account deleted successfully",
    deletedData,
    ...(errors.length > 0 && { warnings: errors }),
  });
}
