import { createClient as createSbClient } from "@supabase/supabase-js";
import { createCompatClient, type CompatClient } from "@/lib/admin-db/shim";

/**
 * Service-role client for the **admin database** — bypasses RLS.
 *
 * NOW BACKED BY POCKETBASE: returns the same `from(...).select().eq()` shim
 * as `createClient()` from `./server.ts`. Use only server-side. Existing
 * authorization in routes still applies — the shim is admin-token-authed.
 */
export function createAdminServiceClient(): CompatClient {
  return createCompatClient();
}

/**
 * Real Supabase client — for STORAGE operations only.
 *
 * Image uploads (admin/src/app/api/upload/route.ts) and asset listing
 * (admin/src/app/api/tenants/[id]/assets/route.ts) still talk to Supabase
 * Storage. The next migration phase ports those to Pocketbase file fields.
 */
export function createSupabaseStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "createSupabaseStorageClient requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createSbClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
