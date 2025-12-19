import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getSessionUser();
  requireRole(user, ["admin", "editor"]);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ data: {} });
  }

  const supabase = await createSupabaseServerClient({ useServiceRole: true });
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .order("key");

  if (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json({ data: {} });
  }

  // Convert array to object
  const settings: Record<string, string> = {};
  (data || []).forEach((row: any) => {
    settings[row.key] = row.value;
  });

  return NextResponse.json({ data: settings });
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  requireRole(user, ["admin"]);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const body = await req.json();
  const { key, value } = body;

  if (!key || typeof key !== "string") {
    return NextResponse.json({ error: "Key is required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient({ useServiceRole: true });
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value: value || null, updated_at: new Date().toISOString() }, { onConflict: "key" });

  if (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
