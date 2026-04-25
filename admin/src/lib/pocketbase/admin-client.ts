/**
 * Server-side client for the central admin Pocketbase instance
 * (`mbg-pb-admin.fly.dev` — the Supabase replacement, Phase A of
 * docs/ADMIN_SUPABASE_TO_POCKETBASE.md).
 *
 * Mirrors the shape of `admin/src/lib/supabase/admin.ts`: returns a
 * service-role-equivalent client (admin-token-authed PB) usable from any
 * Next.js server runtime. Auth token is cached in module scope with a
 * conservative TTL so we don't re-auth on every request.
 *
 * Read paths from the admin portal go through this lib once Phase B
 * dual-read lands. Write paths in Phase D. Until then it's source code
 * only — `mbg-pb-admin` exists but no code calls into it yet.
 *
 * NOT for use against per-tenant PB instances — those are accessed via
 * `client.ts`'s `PocketbaseClient` constructed per-tenant.
 */

import { PocketbaseClient } from "./client";
import { PB_ADMIN_EMAIL } from "./constants";

/** ──────── Record interfaces ────────
 * One per collection in `infra/pocketbase/schemas/admin.json`. Field names
 * match the PB collection schema. PB-built-in fields (`id`, `created`,
 * `updated`) are always present.
 */

export interface PocketbaseSystemFields {
  /** PB auto-generated 15-char ID. */
  id: string;
  /** ISO 8601 timestamp. */
  created: string;
  /** ISO 8601 timestamp. */
  updated: string;
}

export interface AdminTenant extends PocketbaseSystemFields {
  /** Human-readable tenant identifier (matches old Supabase `tenants.id`). */
  slug: string;
  business_name: string;
  template_type:
    | "informational"
    | "authenticated"
    | "booking"
    | "commerce"
    | "loyalty"
    | "content"
    | "forms"
    | "directory"
    | "custom";
  status: "draft" | "preview" | "production";
  config: Record<string, unknown>;
  supabase_project_id: string | null;
  supabase_url: string | null;
  supabase_anon_key: string | null;
  expo_project_id: string | null;
  app_version: string;
  created_by: string | null;
  app_type: "template" | "custom";
  repo_url: string | null;
  repo_branch: string;
  appetize_public_key: string | null;
  appetize_public_key_ios: string | null;
  brief: Record<string, unknown>;
  pocketbase_url: string | null;
  pocketbase_app_name: string | null;
  backend: "supabase" | "pocketbase";
}

export interface AdminBuild extends PocketbaseSystemFields {
  /** PB relation — points at a `tenants` record id. */
  tenant: string;
  workflow_run_id: string | null;
  platform: "ios" | "android" | "all" | null;
  profile: "preview" | "production" | "development" | null;
  status: "pending" | "in_progress" | "succeeded" | "failed" | "cancelled";
  build_url: string | null;
  download_url: string | null;
  download_url_ios: string | null;
  error_message: string | null;
  app_version: string | null;
  eas_build_id_android: string | null;
  eas_build_id_ios: string | null;
  appetize_public_key: string | null;
  appetize_public_key_ios: string | null;
  config_hash: string | null;
}

export interface AdminTenantUser extends PocketbaseSystemFields {
  /** PB relation — points at a `users` (auth collection) record id. */
  user: string;
  /** PB relation — points at a `tenants` record id. */
  tenant: string;
  role: "admin" | "client";
}

export interface AdminPushToken extends PocketbaseSystemFields {
  tenant_id: string;
  device_token: string;
  platform: "ios" | "android";
}

export interface AdminAnalyticsEvent extends PocketbaseSystemFields {
  tenant_id: string;
  anonymous_id: string;
  event_name: string;
  event_data: Record<string, unknown> | null;
  screen_name: string | null;
  platform: "ios" | "android" | "web" | null;
  app_version: string | null;
}

export interface AdminActivityLog extends PocketbaseSystemFields {
  /** PB relation — points at a `tenants` record id. */
  tenant: string;
  action: string;
  details: string | null;
  user_email: string | null;
}

/** ──────── Token cache ──────── */

interface CachedToken {
  token: string;
  /** Unix ms when this cached token should be considered stale. */
  expiresAt: number;
}

let cached: CachedToken | null = null;

/** PB tokens default to 14 days; we re-auth every hour to keep things fresh. */
const TOKEN_TTL_MS = 60 * 60 * 1000;

function getAdminUrl(): string {
  const url = process.env.POCKETBASE_ADMIN_URL;
  if (!url) {
    throw new Error(
      "POCKETBASE_ADMIN_URL not set. Add it to admin/.env.local " +
        "(see ADMIN_SUPABASE_TO_POCKETBASE.md). Pointing at " +
        "https://mbg-pb-admin.fly.dev today.",
    );
  }
  return url;
}

function getAdminPassword(): string {
  const pw = process.env.PB_ADMIN_PASSWORD;
  if (!pw) {
    throw new Error(
      "PB_ADMIN_PASSWORD not set. Sync Fly secrets / .env.local " +
        "(op://MBG/Pocketbase Admin/password).",
    );
  }
  return pw;
}

async function getCachedToken(): Promise<string> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.token;
  }
  const res = await fetch(`${getAdminUrl()}/api/admins/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identity: PB_ADMIN_EMAIL,
      password: getAdminPassword(),
    }),
  });
  if (!res.ok) {
    throw new Error(`Admin PB auth failed: HTTP ${res.status}`);
  }
  const body = (await res.json()) as { token: string };
  cached = { token: body.token, expiresAt: now + TOKEN_TTL_MS };
  return body.token;
}

/** Force-invalidate the cached admin token (e.g., after password rotation). */
export function invalidateAdminToken(): void {
  cached = null;
}

/**
 * Get an admin-token-authed Pocketbase client for the central admin DB.
 * Service-role-equivalent: bypasses all collection access rules.
 */
export async function adminPb(): Promise<PocketbaseClient> {
  const token = await getCachedToken();
  return new PocketbaseClient({
    url: getAdminUrl(),
    adminToken: token,
  });
}

/** ──────── High-level helpers ────────
 * Mirror the operations the admin portal currently does against Supabase.
 * Each helper is one server-side call; callers in API routes can compose
 * them. Add more as Phase B/D pulls more of the admin code over.
 */

/** Fetch a tenant by its human-readable slug. Returns null if not found. */
export async function getTenantBySlug(
  slug: string,
): Promise<AdminTenant | null> {
  const pb = await adminPb();
  const result = await pb.list<AdminTenant>("tenants", {
    filter: `slug = "${slug.replace(/"/g, '\\"')}"`,
    perPage: 1,
  });
  return result.items[0] ?? null;
}

/** List all tenants, most recently updated first. */
export async function listTenants(perPage = 100): Promise<AdminTenant[]> {
  const pb = await adminPb();
  const result = await pb.list<AdminTenant>("tenants", {
    perPage,
    sort: "-updated",
  });
  return result.items;
}

/** List builds for a tenant (newest first). */
export async function listBuildsForTenant(
  tenantId: string,
  perPage = 50,
): Promise<AdminBuild[]> {
  const pb = await adminPb();
  const result = await pb.list<AdminBuild>("builds", {
    filter: `tenant = "${tenantId}"`,
    sort: "-created",
    perPage,
  });
  return result.items;
}
