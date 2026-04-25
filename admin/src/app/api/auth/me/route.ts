import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-pb/server";

/**
 * Lightweight identity endpoint — returns the current user's email + role.
 * Used by client components (Sidebar) that need to display user identity
 * without doing a full PB roundtrip themselves.
 */
export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    email: session.user.email,
    name: session.user.name ?? null,
    is_mbg_admin: session.user.is_mbg_admin,
  });
}
