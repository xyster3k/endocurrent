import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ data: [] });
  }

  const supabase = await createSupabaseServerClient({ useServiceRole: true });
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

const updateSchema = z.object({
  id: z.string().uuid(),
  image_url: z.string().nullable().optional(),
  order_index: z.number().optional(),
});

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;
  const supabase = await createSupabaseServerClient({ useServiceRole: true });
  const { data, error } = await supabase
    .from("categories")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
