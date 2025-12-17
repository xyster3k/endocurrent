import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";


export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ data: { menus: [], items: [] } }, { status: 200 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: menus, error: menuErr } = await supabase.from("menus").select("*").limit(1);
  if (menuErr) return NextResponse.json({ error: menuErr.message }, { status: 500 });
  if (!menus || menus.length === 0) return NextResponse.json({ data: { menus: [], items: [] } }, { status: 200 });

  const menuId = (menus as any)[0]?.id;
  const { data: items, error: itemErr } = await supabase
    .from("menu_items")
    .select("*")
    .eq("menu_id", menuId)
    .order("order_index", { ascending: true, nullsFirst: true });
  if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 });

  return NextResponse.json({ data: { menu: menus[0], items: items ?? [] } }, { status: 200 });
}
