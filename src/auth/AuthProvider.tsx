import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient, type Session, type User, type SupabaseClient } from "@supabase/supabase-js";
import type { AuthConfig } from "../templates/types";
import { secureStoreAdapter } from "./supabaseStorage";
import { resolveTenantBackend, type TenantBackend } from "../data/tenantBackend";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  supabase: SupabaseClient;
  /**
   * Where this tenant's per-tenant data lives. Hooks like usePosts /
   * usePost dispatch their queries based on this. End-user auth still
   * goes through `supabase` until Phase 3 of the PB migration moves it.
   */
  backend: TenantBackend;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  supabase: null as unknown as SupabaseClient,
  backend: null as unknown as TenantBackend,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
  resetPassword: async () => ({}),
});

export function useAuth() {
  return useContext(AuthContext);
}

type Props = {
  config: AuthConfig;
  children: React.ReactNode;
};

export function AuthProvider({ config, children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase: SupabaseClient = useMemo(
    () =>
      createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          storage: secureStoreAdapter,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      }),
    [config.supabaseUrl, config.supabaseAnonKey]
  );

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const backend = useMemo(() => resolveTenantBackend(config), [config]);

  const value: AuthState = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      supabase,
      backend,

      signIn: async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        return {};
      },

      signUp: async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) return { error: error.message };
        return {};
      },

      signOut: async () => {
        await supabase.auth.signOut();
      },

      resetPassword: async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) return { error: error.message };
        return {};
      },
    }),
    [session, loading, supabase, backend]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
