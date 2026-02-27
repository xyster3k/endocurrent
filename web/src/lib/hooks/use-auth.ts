"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User, Session, SupabaseClient } from "@supabase/supabase-js";

export type AuthProfile = {
  display_name: string | null;
  role: string | null;
};

function tryCreateClient(): SupabaseClient | null {
  try {
    return createSupabaseBrowserClient();
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = useMemo(() => tryCreateClient(), []);

  const fetchProfile = useCallback(
    async (userId: string) => {
      if (!supabase) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, role")
        .eq("id", userId)
        .maybeSingle();
      setProfile(data ? { display_name: data.display_name, role: data.role } : null);
    },
    [supabase]
  );

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, [supabase]);

  return { user, session, profile, loading, signOut };
}
