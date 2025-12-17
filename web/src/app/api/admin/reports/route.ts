import { NextResponse } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";


export async function GET() {
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ data: [], meta: { total: 0 } });
  }

  const supabase = await createSupabaseServerClient({ useServiceRole: true });
  const { data, error } = await supabase
    .from("article_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, meta: { total: data?.length ?? 0 } });
}
