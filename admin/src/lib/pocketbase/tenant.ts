import { createAdminServiceClient } from "@/lib/supabase/admin";
import { PocketbaseClient } from "./client";

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

  // Admin credentials come from env — same token is valid for every PB
  // instance we provision because the provisioning script seeds the same
  // admin account on each (see scripts/provisionPocketbase.ts).
  const adminEmail = process.env.PB_ADMIN_EMAIL;
  const adminPassword = process.env.PB_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error(
      "PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD must be set in admin env to talk to tenant PB instances"
    );
  }

  return new PocketbaseClient({
    url: tenant.pocketbase_url,
    adminEmail,
    adminPassword,
  });
}
