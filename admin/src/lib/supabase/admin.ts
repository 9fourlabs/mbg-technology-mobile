import { createCompatClient, type CompatClient } from "@/lib/admin-db/shim";

/**
 * Service-role-equivalent client for the admin database.
 *
 * Now backed by Pocketbase via the compat shim. The shim authenticates
 * with `mbg-pb-admin`'s admin token, which bypasses every collection
 * access rule — equivalent to Supabase's service-role key. Use only
 * server-side and only after route-level authorization has run.
 *
 * This export is kept under `lib/supabase/admin.ts` for backward
 * compatibility with the ~10 callers that still import from here.
 * The path will be renamed to `lib/admin-db/` in a follow-up cleanup
 * once we're satisfied nothing breaks.
 */
export function createAdminServiceClient(): CompatClient {
  return createCompatClient();
}
