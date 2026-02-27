import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const userId = user.id;

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

  // Delete Supabase data
  try {
    const adminSupabase = await createSupabaseServerClient({ useServiceRole: true });

    // Delete article likes
    const { error: likesError } = await (adminSupabase as any)
      .from("article_likes")
      .delete()
      .eq("user_id", userId);
    if (likesError) {
      errors.push(`article_likes: ${likesError.message}`);
    } else {
      deletedData.push("article_likes");
    }

    // Delete article reports
    const { error: reportsError } = await (adminSupabase as any)
      .from("article_reports")
      .delete()
      .eq("user_id", userId);
    if (reportsError) {
      errors.push(`article_reports: ${reportsError.message}`);
    } else {
      deletedData.push("article_reports");
    }

    // Delete user subscriptions
    const { error: subsError } = await (adminSupabase as any)
      .from("user_subscriptions")
      .delete()
      .eq("user_id", userId);
    if (subsError) {
      errors.push(`user_subscriptions: ${subsError.message}`);
    } else {
      deletedData.push("user_subscriptions");
    }

    // Delete profile
    const { error: profileError } = await (adminSupabase as any)
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (profileError) {
      errors.push(`profiles: ${profileError.message}`);
    } else {
      deletedData.push("profiles");
    }

    // Anonymize authored articles (don't delete them)
    const { error: articlesError } = await (adminSupabase as any)
      .from("articles")
      .update({ author_id: null })
      .eq("author_id", userId);
    if (articlesError) {
      errors.push(`articles anonymization: ${articlesError.message}`);
    } else {
      deletedData.push("articles (anonymized)");
    }

    // Delete the Supabase Auth user
    const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      errors.push(`auth account: ${authDeleteError.message}`);
    } else {
      deletedData.push("auth_account");
    }
  } catch (error) {
    errors.push(`Deletion error: ${String(error)}`);
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
