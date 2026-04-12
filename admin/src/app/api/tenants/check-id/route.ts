import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/tenants/check-id?id=my-tenant
 *
 * Quick availability check for tenant IDs. Used by the creation wizard
 * to give real-time feedback as the consultant types.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id || id.length < 3) {
    return NextResponse.json({ available: false, reason: "ID too short" });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  return NextResponse.json({ available: !data });
}
