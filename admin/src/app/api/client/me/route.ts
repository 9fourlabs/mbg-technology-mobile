import { NextResponse } from "next/server";
import { getUserContext } from "@/lib/auth/user-context";

/**
 * Returns the current user's role and tenants. Used by client-portal pages
 * that need to read the user context from the browser (otherwise prefer
 * `getUserContext()` directly in server components).
 */
export async function GET() {
  const ctx = await getUserContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  return NextResponse.json({
    user: { id: ctx.user.id, email: ctx.user.email },
    role: ctx.role,
    tenantIds: ctx.tenantIds,
  });
}
