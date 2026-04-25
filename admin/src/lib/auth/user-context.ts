/**
 * Resolve the current user's role and tenant access.
 *
 * Backed by Pocketbase auth — `mbg-pb-admin`'s `users` collection plus the
 * `tenant_users` membership table on the same instance. The caller's API
 * (UserContext shape, getUserContext / requireAdmin / requireTenantAccess)
 * is unchanged from the previous Supabase implementation, so server
 * components and API routes don't need to be rewritten.
 *
 * Role resolution:
 *   1. `users.is_mbg_admin === true` → admin (fast path; one PB call)
 *   2. tenant_users row with role='admin' for this user → admin
 *   3. Any tenant_users rows → client (scoped to those tenant ids)
 *   4. No rows → role 'client' with no tenants
 */

import { adminPb } from "@/lib/pocketbase/admin-client";
import { getServerSession, type PbUser } from "@/lib/auth-pb/server";

export type UserRole = "admin" | "client";

export interface UserContext {
  user: PbUser;
  role: UserRole;
  /**
   * Tenant slugs (matches `/client/[tenantId]/...` URL params and the
   * existing `tenant.id` semantics from the Supabase era). Callers can
   * `ctx.tenantIds.includes(tenantId)` exactly as before.
   * Empty for admins (admins see all tenants).
   */
  tenantIds: string[];
  /**
   * Internal PB record IDs of tenants the user belongs to. Only needed
   * for callers issuing PB relation queries (e.g. `filter='tenant = "<id>"'`).
   * Most callers should use `tenantIds` instead.
   */
  tenantPbIds: string[];
}

interface TenantUserRow {
  id: string;
  user: string;
  tenant: string;
  role: "admin" | "client";
  expand?: { tenant?: { id: string; slug: string } };
}

export async function getUserContext(): Promise<UserContext | null> {
  const session = await getServerSession();
  if (!session) return null;

  // Fast path: user record already says they're MBG admin.
  if (session.user.is_mbg_admin) {
    return {
      user: session.user,
      role: "admin",
      tenantIds: [],
      tenantPbIds: [],
    };
  }

  // Look up tenant memberships, expanding the related tenant so we get the slug too.
  const pb = await adminPb();
  const result = await pb.list<TenantUserRow>("tenant_users", {
    filter: `user = "${session.user.id}"`,
    expand: "tenant",
    perPage: 100,
  });
  const memberships = result.items;
  const isAdmin = memberships.some((m) => m.role === "admin");

  const tenantPbIds = memberships.map((m) => m.tenant);
  const tenantIds = memberships
    .map((m) => m.expand?.tenant?.slug)
    .filter((s): s is string => Boolean(s));

  return {
    user: session.user,
    role: isAdmin ? "admin" : "client",
    tenantIds,
    tenantPbIds,
  };
}

export async function requireAdmin(): Promise<UserContext> {
  const ctx = await getUserContext();
  if (!ctx) throw new Error("UNAUTHENTICATED");
  if (ctx.role !== "admin") throw new Error("FORBIDDEN");
  return ctx;
}

export async function requireTenantAccess(
  tenantId: string,
): Promise<UserContext> {
  const ctx = await getUserContext();
  if (!ctx) throw new Error("UNAUTHENTICATED");
  if (ctx.role === "admin") return ctx;
  if (!ctx.tenantIds.includes(tenantId)) throw new Error("FORBIDDEN");
  return ctx;
}
