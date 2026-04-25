import { createAdminServiceClient } from "@/lib/supabase/admin";
import { PocketbaseClient } from "./client";
import { PB_ADMIN_EMAIL } from "./constants";

/**
 * Get a Pocketbase client bound to a tenant's dedicated PB instance.
 *
 * Lookup pattern mirrors `admin/src/lib/supabase/tenant.ts` so routes can
 * be ported 1:1 once Phase 1 ships. Returns null if the tenant is still on
 * the Supabase backend — callers should check `tenant.backend` first.
 */
export async function getTenantPocketbase(
  tenantId: string
): Promise<PocketbaseClient | null> {
  const supabase = createAdminServiceClient();
  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("backend, pocketbase_url")
    .eq("id", tenantId)
    .single();

  if (error || !tenant) {
    throw new Error(
      `Tenant ${tenantId} not found in admin DB: ${error?.message ?? "no row"}`
    );
  }

  if (tenant.backend !== "pocketbase") return null;
  if (!tenant.pocketbase_url) {
    throw new Error(
      `Tenant ${tenantId} has backend='pocketbase' but no pocketbase_url — provisioning incomplete`
    );
  }

  // Admin credentials: email is a project constant (PB_ADMIN_EMAIL) — same
  // shared admin account across every PB instance because the provisioning
  // script seeds it identically on each. Password comes from env (Fly secret
  // / op-injected .env.local).
  const adminPassword = process.env.PB_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      "PB_ADMIN_PASSWORD must be set in admin env (op://MBG/Pocketbase Admin/password) to talk to tenant PB instances",
    );
  }

  return new PocketbaseClient({
    url: tenant.pocketbase_url,
    adminEmail: PB_ADMIN_EMAIL,
    adminPassword,
  });
}
