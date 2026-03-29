import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client scoped to a specific tenant's project using their
 * URL and service-role key. This bypasses RLS and should only be used on the
 * server side for admin operations.
 */
export function createTenantClient(
  supabaseUrl: string,
  serviceRoleKey: string
) {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
