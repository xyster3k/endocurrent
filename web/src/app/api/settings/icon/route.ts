import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  // Default icon URL (local file)
  const defaultIcon = "/site-icon.png";

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ url: defaultIcon });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await (supabase as any)
      .from("site_settings")
      .select("value")
      .eq("key", "site_icon_url")
      .maybeSingle();

    const iconUrl = data?.value;

    if (iconUrl && typeof iconUrl === "string" && iconUrl.trim()) {
      return NextResponse.json({ url: iconUrl });
    }

    return NextResponse.json({ url: defaultIcon });
  } catch {
    return NextResponse.json({ url: defaultIcon });
  }
}
