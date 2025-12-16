import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

export async function GET() {
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ data: { menus: [], items: [] } }, { status: 200 });
  }

  const supabase = await createSupabaseServerClient({ useServiceRole: true });
  const { data: menus, error: menuErr } = await supabase.from("menus").select("*");
  const { data: items, error: itemErr } = await supabase.from("menu_items").select("*");
  if (menuErr || itemErr) {
    return NextResponse.json({ error: menuErr?.message || itemErr?.message }, { status: 500 });
  }
  return NextResponse.json({ data: { menus: menus ?? [], items: items ?? [] } }, { status: 200 });
}

const menuSchema = z.object({
  name: z.string().min(1),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);
  const body = await req.json();
  const parsed = menuSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, data: { name: parsed.data.name, id: "mock" } });
  }
  const supabase = await createSupabaseServerClient({ useServiceRole: true });
  const { data, error } = await (supabase as any)
    .from("menus")
    .insert({ name: parsed.data.name })
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data }, { status: 200 });
}
