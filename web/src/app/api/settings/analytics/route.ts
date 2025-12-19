import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ data: null });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["ga_measurement_id", "gtm_container_id"]);

    if (error || !data) {
      return NextResponse.json({ data: null });
    }

    const settings: Record<string, string> = {};
    data.forEach((row: any) => {
      if (row.value) {
        settings[row.key] = row.value;
      }
    });

    return NextResponse.json({
      data: {
        measurementId: settings.ga_measurement_id || null,
        gtmId: settings.gtm_container_id || null,
      }
    });
  } catch {
    return NextResponse.json({ data: null });
  }
}
