import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

const itemSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
  category: z.string().optional(),
  parent_id: z.string().nullable().optional(),
  order_index: z.number().int().nullable().optional(),
});

type Params = Promise<{ id: string }>;

export async function PUT(req: Request, props: { params: Params }) {
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);
  const params = await props.params;
  const body = await req.json();
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createSupabaseServerClient({ useServiceRole: true });
  const { data, error } = await (supabase as any)
    .from("menu_items")
    .update({
      label: parsed.data.label,
      url: parsed.data.url,
      category: parsed.data.category ?? null,
      parent_id: parsed.data.parent_id ?? null,
      order_index: parsed.data.order_index ?? null,
    })
    .eq("id", params.id)
    .select()
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

export async function DELETE(_req: Request, props: { params: Params }) {
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);
  const params = await props.params;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createSupabaseServerClient({ useServiceRole: true });
  const { error } = await (supabase as any).from("menu_items").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
