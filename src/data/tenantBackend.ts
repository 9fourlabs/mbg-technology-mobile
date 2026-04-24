/**
 * Tenant-backend resolver — exposes which backend a tenant's
 * per-tenant data lives in (Supabase vs Pocketbase). Hooks read this
 * to dispatch their queries.
 *
 * Phase 1c-mobile of the Pocketbase migration. End-user auth still goes
 * through Supabase regardless; this only controls per-tenant data reads.
 */

import type { AuthConfig } from "../templates/types";

export type TenantBackend =
  | { kind: "supabase"; auth: AuthConfig }
  | { kind: "pocketbase"; pocketbaseUrl: string; auth: AuthConfig };

/**
 * Default to Supabase unless the tenant config explicitly opts into
 * Pocketbase by setting `backend: "pocketbase"` AND `pocketbaseUrl`.
 *
 * This keeps existing tenants (mbg, sample-*) working unchanged —
 * Pocketbase is opt-in until Phase 4 cuts everyone over.
 */
export function resolveTenantBackend(auth: AuthConfig): TenantBackend {
  if (auth.backend === "pocketbase" && auth.pocketbaseUrl) {
    return { kind: "pocketbase", pocketbaseUrl: auth.pocketbaseUrl, auth };
  }
  return { kind: "supabase", auth };
}
