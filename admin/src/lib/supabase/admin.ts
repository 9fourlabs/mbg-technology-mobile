import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for the **admin database** — bypasses RLS, so use only
 * server-side and only when the route has performed its own authorization.
 *
 * Distinct from `createTenantClient` (in tenant.ts), which connects to a
 * specific tenant's own Supabase project. Use this client when you need
 * unrestricted access to the admin tables (tenants, builds, push_tokens,
 * analytics_events, tenant_users, etc.).
 */
export function createAdminServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "createAdminServiceClient requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
