import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/db/types";

export type TypedServerClient = ReturnType<typeof createServerClient<Database>>;

export function createSupabaseServerClient(opts?: { useServiceRole?: boolean }) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL or anon key is missing");
  }

  const cookieStore: any = cookies();

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    opts?.useServiceRole && env.SUPABASE_SERVICE_ROLE_KEY
      ? env.SUPABASE_SERVICE_ROLE_KEY
      : env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Ignore on Edge runtimes where cookies are readonly during rendering
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Ignore
          }
        },
      },
    }
  );

  return supabase;
}
