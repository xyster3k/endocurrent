import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserRole = "subscriber" | "user" | "editor" | "admin";

export type SessionUser = {
  id: string;
  email: string | null;
  role: UserRole;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // Look up role from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = (profile?.role as UserRole) || "subscriber";

    return {
      id: user.id,
      email: user.email ?? null,
      role,
    };
  } catch (error) {
    console.error("getSessionUser failed, returning null", error);
    return null;
  }
}

export async function requireAuth(): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthenticated");
  }
  return user.id;
}

export function requireRole(user: SessionUser | null, allowed: UserRole[]) {
  if (!user) {
    throw new Error("Unauthenticated");
  }
  if (!allowed.includes(user.role)) {
    throw new Error("Forbidden");
  }
}
