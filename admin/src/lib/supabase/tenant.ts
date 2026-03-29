import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createAdminClient } from "./server";
import { getProjectApiKeys } from "./management";

/**
 * Creates a Supabase client scoped to a specific tenant's project using their
 * URL and service-role key. This bypasses RLS and should only be used on the
 * server side for admin operations.
 */
export function createTenantClient(
  supabaseUrl: string,
  serviceRoleKey: string
) {
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

/**
 * Fetches a tenant record from the admin database, retrieves its service-role
 * key via the Management API, and returns a Supabase client connected to that
 * tenant's project with full admin privileges.
 */
export async function getTenantAdminClient(tenantId: string) {
  const admin = await createAdminClient();

  const { data: tenant, error } = await admin
    .from("tenants")
    .select("supabase_project_id, supabase_url")
    .eq("id", tenantId)
    .single();

  if (error || !tenant) {
    throw new Error(`Tenant not found: ${tenantId}`);
  }

  if (!tenant.supabase_project_id) {
    throw new Error(
      `Tenant ${tenantId} is missing supabase_project_id — the Supabase project may not have been provisioned yet.`
    );
  }

  const { serviceRoleKey } = await getProjectApiKeys(
    tenant.supabase_project_id
  );

  return createTenantClient(tenant.supabase_url, serviceRoleKey);
}
