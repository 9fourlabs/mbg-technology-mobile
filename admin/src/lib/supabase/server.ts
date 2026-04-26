/**
 * SHIM: returns a PB-backed compatibility client.
 *
 * Was a `@supabase/ssr` server client. Now redirects to
 * `lib/admin-db/shim.ts`, which exposes the same `.from(table).select()`
 * chain syntax but executes against `mbg-pb-admin` Pocketbase. This
 * keeps every existing callsite (~35 files) working without code changes
 * while we migrate off Supabase.
 *
 * Auth methods (.auth.getUser, .auth.signInWithPassword) are no longer
 * exposed here — callers were migrated to `lib/auth-pb/server.ts` in
 * the Phase C commit.
 *
 * Storage (.storage.from()) is also not on this client — `upload/route.ts`
 * and `assets/route.ts` were migrated to use `createAdminServiceClient()`
 * from `./admin.ts` directly during the auth migration.
 */

import { createCompatClient, type CompatClient } from "@/lib/admin-db/shim";

export async function createClient(): Promise<CompatClient> {
  return createCompatClient();
}
