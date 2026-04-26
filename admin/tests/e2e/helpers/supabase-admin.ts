import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for test-setup tasks (seeding users, clearing
 * playwright-* test tenants). Throws if the required env vars are missing so
 * tests fail loudly rather than touching prod unintentionally.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Playwright needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY " +
        "set (local: `op inject -i admin/.env.local.tpl -o admin/.env.local` + " +
        "source it; CI: GitHub Actions secrets).",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Delete any tenants whose id starts with "playwright-" (test detritus from
 * the tenant-creation wizard tests). Called from global-teardown.
 */
export async function cleanupTestTenants() {
  const supa = supabaseAdmin();
  const { data: tenants } = await supa
    .from("tenants")
    .select("id")
    .like("id", "playwright-%");
  if (!tenants?.length) return 0;
  const ids = tenants.map((t) => t.id);
  await supa.from("builds").delete().in("tenant_id", ids);
  await supa.from("tenants").delete().in("id", ids);
  return ids.length;
}
