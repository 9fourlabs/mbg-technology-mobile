import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/auth/user-context";

async function authorize(tenantId: string): Promise<NextResponse | null> {
  const ctx = await getUserContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (ctx.role !== "admin" && !ctx.tenantIds.includes(tenantId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;

    const denied = await authorize(tenantId);
    if (denied) return denied;

    const body = await request.json();
    const { version } = body;

    if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
      return NextResponse.json(
        { error: "Invalid version format. Use semver (e.g., 1.2.3)." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("tenants")
      .update({ app_version: version })
      .eq("id", tenantId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update version" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, version });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
