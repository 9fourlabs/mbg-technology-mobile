/**
 * Test-setup helper. Despite the filename, this no longer talks to
 * Supabase — the admin DB is on Pocketbase since the Phase A–E
 * migration. Filename kept for backward-compat with existing test
 * imports; rename in a follow-up.
 *
 * Uses the PB admin auth token to perform service-role-equivalent
 * operations (seeding users, clearing playwright-* test tenants).
 */

const PB_URL =
  process.env.POCKETBASE_ADMIN_URL ?? "https://mbg-pb-admin.fly.dev";
const PB_ADMIN_EMAIL = "pb-admin@9fourlabs.com";

interface PbAdminClient {
  list<T>(collection: string, query?: Record<string, string>): Promise<T[]>;
  remove(collection: string, id: string): Promise<void>;
}

let cachedToken: { token: string; expires: number } | null = null;

async function pbAdminToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now()) return cachedToken.token;
  const password = process.env.PB_ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "Playwright needs PB_ADMIN_PASSWORD set (local: `op inject -i " +
        "admin/.env.local.tpl -o admin/.env.local` + source it; " +
        "CI: GitHub Actions secrets).",
    );
  }
  const res = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: PB_ADMIN_EMAIL, password }),
  });
  if (!res.ok) {
    throw new Error(`PB admin auth failed: HTTP ${res.status}`);
  }
  const body = (await res.json()) as { token: string };
  cachedToken = {
    token: body.token,
    expires: Date.now() + 60 * 60 * 1000, // 1h
  };
  return body.token;
}

export function supabaseAdmin(): PbAdminClient {
  return {
    async list<T>(
      collection: string,
      query: Record<string, string> = {},
    ): Promise<T[]> {
      const token = await pbAdminToken();
      const params = new URLSearchParams({ perPage: "200", ...query });
      const res = await fetch(
        `${PB_URL}/api/collections/${collection}/records?${params}`,
        { headers: { Authorization: token } },
      );
      if (!res.ok) {
        throw new Error(`PB list ${collection} failed: HTTP ${res.status}`);
      }
      const body = (await res.json()) as { items: T[] };
      return body.items;
    },
    async remove(collection: string, id: string): Promise<void> {
      const token = await pbAdminToken();
      await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });
    },
  };
}

/**
 * Delete any tenants whose slug starts with "playwright-" (test detritus
 * from the tenant-creation wizard tests). Called from global-teardown.
 */
export async function cleanupTestTenants(): Promise<number> {
  const pb = supabaseAdmin();
  const tenants = await pb.list<{ id: string; slug: string }>("tenants", {
    filter: 'slug ~ "playwright-"',
  });
  if (!tenants.length) return 0;
  for (const t of tenants) {
    // Builds will cascade-delete via PB relation rules.
    await pb.remove("tenants", t.id);
  }
  return tenants.length;
}
