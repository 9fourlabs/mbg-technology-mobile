#!/usr/bin/env node
/**
 * One-shot mirror: copy `tenants` + `tenant_users` rows from the central
 * Supabase admin DB to `mbg-pb-admin` Pocketbase. Idempotent — re-running
 * with the same data produces the same outcome (tenants matched by slug,
 * tenant_users by (user_email, tenant_slug)).
 *
 * Doesn't touch `builds`, `push_tokens`, `analytics_events`, `activity_log`
 * yet — those tables stay on Supabase until the next migration phase.
 *
 * Run after PB users have been seeded (so user-by-email lookups succeed).
 *
 * Usage:
 *   PB_ADMIN_PASSWORD=... \
 *   NEXT_PUBLIC_SUPABASE_URL=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx tsx scripts/migrateAdminToPb.ts [--dry-run]
 *
 * Note: Supabase auth.users is queried via the admin auth API to map
 * user_id (UUID) → email, which then maps to a PB user via email.
 */

import { createClient } from "@supabase/supabase-js";

const PB_URL = "https://mbg-pb-admin.fly.dev";
const PB_ADMIN_EMAIL = "pb-admin@9fourlabs.com";

interface SupabaseTenant {
  id: string; // slug
  business_name: string;
  template_type: string;
  status: string;
  config: Record<string, unknown>;
  supabase_project_id: string | null;
  supabase_url: string | null;
  supabase_anon_key: string | null;
  expo_project_id: string | null;
  app_version: string;
  created_by: string | null;
  app_type: string;
  repo_url: string | null;
  repo_branch: string;
  appetize_public_key: string | null;
  appetize_public_key_ios: string | null;
  brief: Record<string, unknown> | null;
  pocketbase_url: string | null;
  pocketbase_app_name: string | null;
  backend: string;
}

interface SupabaseTenantUser {
  id: string;
  user_id: string;
  tenant_id: string;
  role: "admin" | "client";
  created_at: string;
}

interface PbTenant {
  id: string;
  slug: string;
}

interface PbUser {
  id: string;
  email: string;
}

async function getPbAdminToken(password: string): Promise<string> {
  const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: PB_ADMIN_EMAIL, password }),
  });
  if (!res.ok) throw new Error(`PB admin auth failed: ${res.status}`);
  return ((await res.json()) as { token: string }).token;
}

async function pbList<T>(
  token: string,
  collection: string,
  filter?: string,
): Promise<T[]> {
  const qs = new URLSearchParams({ perPage: "200" });
  if (filter) qs.set("filter", filter);
  const res = await fetch(
    `${PB_URL}/api/collections/${collection}/records?${qs}`,
    { headers: { Authorization: token } },
  );
  if (!res.ok) {
    throw new Error(`PB list ${collection} failed: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as { items: T[] };
  return body.items;
}

async function pbCreate(
  token: string,
  collection: string,
  data: Record<string, unknown>,
): Promise<{ id: string }> {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`PB create ${collection} failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as { id: string };
}

async function pbUpdate(
  token: string,
  collection: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(
    `${PB_URL}/api/collections/${collection}/records/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) {
    throw new Error(`PB update ${collection}/${id} failed: ${res.status}`);
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const pbPw = process.env.PB_ADMIN_PASSWORD;
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!pbPw || !sbUrl || !sbKey) {
    throw new Error(
      "PB_ADMIN_PASSWORD, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY are required",
    );
  }

  console.log(`▶ Starting admin DB mirror${dryRun ? " (DRY RUN)" : ""}`);

  const sb = createClient(sbUrl, sbKey, {
    auth: { persistSession: false },
  });
  const token = await getPbAdminToken(pbPw);
  console.log("  ✓ PB admin token acquired");

  // 1. tenants
  const { data: sbTenants, error: tenantsErr } = await sb
    .from("tenants")
    .select("*");
  if (tenantsErr) throw tenantsErr;
  console.log(`▶ Found ${sbTenants?.length ?? 0} tenants in Supabase`);

  const pbTenants = await pbList<PbTenant>(token, "tenants");
  const pbTenantBySlug = new Map(pbTenants.map((t) => [t.slug, t]));

  let tenantsCreated = 0;
  let tenantsUpdated = 0;
  for (const t of (sbTenants ?? []) as SupabaseTenant[]) {
    const payload = {
      slug: t.id,
      business_name: t.business_name,
      template_type: t.template_type,
      status: t.status,
      config: t.config ?? {},
      supabase_project_id: t.supabase_project_id,
      supabase_url: t.supabase_url,
      supabase_anon_key: t.supabase_anon_key,
      expo_project_id: t.expo_project_id,
      app_version: t.app_version,
      created_by: t.created_by,
      app_type: t.app_type,
      repo_url: t.repo_url,
      repo_branch: t.repo_branch,
      appetize_public_key: t.appetize_public_key,
      appetize_public_key_ios: t.appetize_public_key_ios,
      brief: t.brief ?? {},
      pocketbase_url: t.pocketbase_url,
      pocketbase_app_name: t.pocketbase_app_name,
      backend: t.backend,
    };
    const existing = pbTenantBySlug.get(t.id);
    if (existing) {
      if (!dryRun) await pbUpdate(token, "tenants", existing.id, payload);
      tenantsUpdated++;
    } else {
      if (!dryRun) {
        const created = await pbCreate(token, "tenants", payload);
        pbTenantBySlug.set(t.id, { id: created.id, slug: t.id });
      }
      tenantsCreated++;
    }
  }
  console.log(
    `  ✓ tenants: ${tenantsCreated} created, ${tenantsUpdated} updated`,
  );

  // 2. tenant_users (requires user-by-email mapping)
  const { data: sbTenantUsers, error: tuErr } = await sb
    .from("tenant_users")
    .select("*");
  if (tuErr) throw tuErr;

  const { data: sbAuthUsers, error: authErr } =
    await sb.auth.admin.listUsers();
  if (authErr) throw authErr;
  const supabaseUserById = new Map(
    sbAuthUsers.users.map((u) => [u.id, u.email ?? ""]),
  );
  console.log(
    `▶ Found ${sbTenantUsers?.length ?? 0} tenant_users + ${sbAuthUsers.users.length} auth.users in Supabase`,
  );

  const pbUsers = await pbList<PbUser>(token, "users");
  const pbUserByEmail = new Map(pbUsers.map((u) => [u.email.toLowerCase(), u]));

  const pbTenantUsers = await pbList<{
    id: string;
    user: string;
    tenant: string;
  }>(token, "tenant_users");
  const pbTuKey = (userId: string, tenantId: string) => `${userId}::${tenantId}`;
  const pbTuExisting = new Set(
    pbTenantUsers.map((tu) => pbTuKey(tu.user, tu.tenant)),
  );

  let tuCreated = 0;
  let tuSkipped = 0;
  for (const tu of (sbTenantUsers ?? []) as SupabaseTenantUser[]) {
    const email = supabaseUserById.get(tu.user_id)?.toLowerCase();
    if (!email) {
      console.warn(`  ⚠ tenant_users row ${tu.id}: no auth.users email for user_id=${tu.user_id}`);
      tuSkipped++;
      continue;
    }
    const pbUser = pbUserByEmail.get(email);
    if (!pbUser) {
      console.warn(`  ⚠ tenant_users row ${tu.id}: PB has no user with email=${email} — skip`);
      tuSkipped++;
      continue;
    }
    const pbTenant = pbTenantBySlug.get(tu.tenant_id);
    if (!pbTenant) {
      console.warn(`  ⚠ tenant_users row ${tu.id}: PB has no tenant with slug=${tu.tenant_id}`);
      tuSkipped++;
      continue;
    }
    if (pbTuExisting.has(pbTuKey(pbUser.id, pbTenant.id))) {
      tuSkipped++;
      continue;
    }
    if (!dryRun) {
      await pbCreate(token, "tenant_users", {
        user: pbUser.id,
        tenant: pbTenant.id,
        role: tu.role,
      });
    }
    tuCreated++;
  }
  console.log(`  ✓ tenant_users: ${tuCreated} created, ${tuSkipped} skipped`);

  console.log("\n✅ Admin DB mirror complete.");
  if (dryRun) {
    console.log("   (DRY RUN — no writes made.)");
  }
}

main().catch((err) => {
  console.error("✗ Migration failed:", err);
  process.exit(1);
});
