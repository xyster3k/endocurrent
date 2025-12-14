import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

const menuSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string().min(1),
        url: z.string().min(1),
        category: z.string().optional(),
        parent_id: z.string().nullable().optional(),
        order_index: z.number().int().optional(),
      })
    )
    .optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    requireRole(user, ["editor", "admin"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ data: [] }, { status: 200 });
  }

  const supabase = createSupabaseServerClient({ useServiceRole: true });
  const { data: menus, error: menuErr } = await supabase.from("menus").select("*");
  const { data: items, error: itemErr } = await supabase.from("menu_items").select("*");
  if (menuErr || itemErr) {
    return NextResponse.json({ error: menuErr?.message || itemErr?.message }, { status: 500 });
  }
  return NextResponse.json({ data: { menus, items } }, { status: 200 });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    requireRole(user, ["editor", "admin"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = menuSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, message: "Supabase not configured; mock create menu." });
  }

  const supabase = createSupabaseServerClient({ useServiceRole: true });
  const { data: menu, error: menuErr } = await supabase
    .from("menus")
    .insert({ name: parsed.data.name })
    .select()
    .maybeSingle();
  if (menuErr) return NextResponse.json({ error: menuErr.message }, { status: 500 });

  if (parsed.data.items && parsed.data.items.length > 0) {
    const toInsert = parsed.data.items.map((item) => ({
      menu_id: menu?.id,
      label: item.label,
      url: item.url,
      category: item.category ?? null,
      parent_id: item.parent_id ?? null,
      order_index: item.order_index ?? null,
    }));
    const { error: itemsErr } = await supabase.from("menu_items").insert(toInsert);
    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: menu }, { status: 200 });
}
