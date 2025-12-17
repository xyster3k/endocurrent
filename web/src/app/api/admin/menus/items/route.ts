import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";


const itemSchema = z.object({
  menu_id: z.string().min(1),
  label: z.string().min(1),
  url: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  parent_id: z.string().nullable().optional(),
  order_index: z.number().int().nullable().optional(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);
  const body = await req.json();
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, data: { ...parsed.data, id: "mock" } });
  }

  const supabase = await createSupabaseServerClient({ useServiceRole: true });
  const { data, error } = await (supabase as any)
    .from("menu_items")
    .insert({
      menu_id: parsed.data.menu_id,
      label: parsed.data.label,
      url: parsed.data.url || null,
      category: parsed.data.category ?? null,
      parent_id: parsed.data.parent_id ?? null,
      order_index: parsed.data.order_index ?? null,
    })
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data }, { status: 200 });
}
