import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/db/types";

// Access NEXT_PUBLIC_* vars directly so Next.js inlines them at build time.
// Using process.env as a whole object (e.g. via env.ts) won't work on the client.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createSupabaseBrowserClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase env vars are missing");
  }

  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
