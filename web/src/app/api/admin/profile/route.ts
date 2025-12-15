import { NextResponse } from "next/server";
import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";
import { getSessionUser, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

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

  // Always store display name in Clerk public metadata so it works with Clerk IDs
  try {
    const updateUser = clerkClient?.users?.updateUser;
    if (typeof updateUser !== "function") {
      throw new Error("Clerk server key not available – check CLERK_SECRET_KEY");
    }

    await updateUser(user!.id, {
      publicMetadata: {
        ...(user?.role ? { role: user.role } : {}),
        display_name: parsed.data.display_name,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: `Failed to update Clerk profile: ${String(error)}` }, { status: 500 });
  }

  // Optionally mirror to Supabase profiles if configured AND the user id is a UUID
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createSupabaseServerClient({ useServiceRole: true });
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(user?.id ?? "");
    if (isUuid) {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user?.id, display_name: parsed.data.display_name, role: user?.role ?? "subscriber" });
      if (error) {
        return NextResponse.json({ error: `Failed to update Supabase profile: ${error.message}` }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
