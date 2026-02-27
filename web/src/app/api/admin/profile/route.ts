import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  display_name: z.string().min(1).max(120),
});

export async function PUT(req: Request) {
  const user = await getSessionUser();
  requireRole(user, ["editor", "admin"]);

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient({ useServiceRole: true });
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user!.id,
        display_name: parsed.data.display_name,
        role: user?.role ?? "subscriber",
      });

    if (error) {
      console.error("Supabase profile update error:", error);
      return NextResponse.json({ error: `Failed to update profile: ${error.message}` }, { status: 500 });
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: `Failed to update profile: ${String(error)}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
