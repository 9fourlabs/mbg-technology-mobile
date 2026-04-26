import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export type UserRole = "admin" | "client";

export interface UserContext {
  user: User;
  role: UserRole;
  tenantIds: string[];
}

/**
 * Resolve the current user's role and tenant access. Used by the middleware,
 * server components, and API routes to enforce role-based access.
 *
 * Returns null if the user is not authenticated.
 *
 * Role resolution order:
 *   1. JWT app_metadata.role === 'admin' → admin (fastest path; no DB query)
 *   2. tenant_users row with role='admin' → admin
 *   3. Any tenant_users rows → client (scoped to those tenant_ids)
 *   4. No rows → role 'client' with no tenants (locked out of everything)
 */
export async function getUserContext(): Promise<UserContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  // Fast path: app_metadata says admin.
  if ((user.app_metadata as Record<string, unknown> | undefined)?.role === "admin") {
    return { user, role: "admin", tenantIds: [] };
  }

  // Look up tenant_users rows for this user.
  const { data: rows } = await supabase
    .from("tenant_users")
    .select("tenant_id, role")
    .eq("user_id", user.id);

  const memberships = rows ?? [];
  const isAdmin = memberships.some((m) => m.role === "admin");

  if (isAdmin) {
    return { user, role: "admin", tenantIds: memberships.map((m) => m.tenant_id) };
  }

  return {
    user,
    role: "client",
    tenantIds: memberships.map((m) => m.tenant_id),
  };
}

/**
 * Throw a 403-style error if the current user is not an MBG admin.
 * For use in API routes / server components that admin-only paths.
 */
export async function requireAdmin(): Promise<UserContext> {
  const ctx = await getUserContext();
  if (!ctx) throw new Error("UNAUTHENTICATED");
  if (ctx.role !== "admin") throw new Error("FORBIDDEN");
  return ctx;
}

/**
 * Throw if the current user is not authorized to act on the given tenant.
 * Admins pass for any tenant; clients pass only for their owned tenants.
 */
export async function requireTenantAccess(tenantId: string): Promise<UserContext> {
  const ctx = await getUserContext();
  if (!ctx) throw new Error("UNAUTHENTICATED");
  if (ctx.role === "admin") return ctx;
  if (!ctx.tenantIds.includes(tenantId)) throw new Error("FORBIDDEN");
  return ctx;
}
