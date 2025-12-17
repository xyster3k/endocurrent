import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  name: z.string().optional(),
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

type Params = Promise<{ id: string }>;

export async function PUT(req: Request, props: { params: Params }) {
  const params = await props.params;
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, message: "Supabase not configured; mock update menu." });
  }

  const supabase = createSupabaseServerClient({ useServiceRole: true });
  if (parsed.data.name) {
    const { error } = await supabase.from("menus").update({ name: parsed.data.name }).eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (parsed.data.items) {
    for (const item of parsed.data.items) {
      if (item.id) {
        const { error } = await supabase
          .from("menu_items")
          .update({
            label: item.label,
            url: item.url,
            category: item.category ?? null,
            parent_id: item.parent_id ?? null,
            order_index: item.order_index ?? null,
          })
          .eq("id", item.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      } else {
        const { error } = await supabase.from("menu_items").insert({
          menu_id: params.id,
          label: item.label,
          url: item.url,
          category: item.category ?? null,
          parent_id: item.parent_id ?? null,
          order_index: item.order_index ?? null,
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function DELETE(_req: Request, props: { params: Params }) {
  const params = await props.params;
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: true, message: "Supabase not configured; mock delete menu." });
  }

  const supabase = createSupabaseServerClient({ useServiceRole: true });
  await supabase.from("menu_items").delete().eq("menu_id", params.id);
  const { error } = await supabase.from("menus").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 200 });
}
