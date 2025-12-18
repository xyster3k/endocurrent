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

  // Always store display name in Clerk public metadata using REST API
  try {
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      throw new Error("CLERK_SECRET_KEY is not configured");
    }

    const response = await fetch(`https://api.clerk.com/v1/users/${user!.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public_metadata: {
          ...(user?.role ? { role: user.role } : {}),
          display_name: parsed.data.display_name,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Clerk API error: ${response.status} - ${errorData}`);
    }
  } catch (error) {
    console.error("Failed to update Clerk profile:", error);
    return NextResponse.json({ error: `Failed to update Clerk profile: ${String(error)}` }, { status: 500 });
  }

  // Optionally mirror to Supabase profiles if configured AND the user id is a UUID
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = await createSupabaseServerClient({ useServiceRole: true });
      const isUuid = /^[0-9a-fA-F-]{36}$/.test(user?.id ?? "");
      if (isUuid) {
        const { error } = await supabase
          .from("profiles")
          .upsert({ id: user?.id, display_name: parsed.data.display_name, role: user?.role ?? "subscriber" });
        if (error) {
          console.error("Supabase profile update error:", error);
          // Don't fail the whole request if Supabase update fails, just log it
        }
      }
    } catch (error) {
      console.error("Error updating Supabase profile:", error);
      // Don't fail the whole request if Supabase update fails
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
