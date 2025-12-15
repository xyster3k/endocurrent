import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Return mock categories when Supabase is not configured
    return NextResponse.json({
      data: ["thyroid", "diabetes", "oncology", "general"]
    });
  }

  try {
    const supabase = createSupabaseServerClient();

    // Get all unique categories from menu_items where category is not null
    const { data, error } = await supabase
      .from("menu_items")
      .select("category")
      .not("category", "is", null)
      .order("category");

    if (error) throw error;

    // Extract unique categories
    const categories = [...new Set(
      (data || [])
        .map((item: any) => item.category)
        .filter((cat: string | null) => cat && cat.trim() !== "")
    )].sort();

    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    // Return empty array on error
    return NextResponse.json({ data: [] });
  }
}
