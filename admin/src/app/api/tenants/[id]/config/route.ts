import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/auth/user-context";

/**
 * GET tenant config + recent build hashes for the config-editor page.
 * Used by client-side `/tenants/[id]/config/page.tsx`.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: tenantId } = await params;
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.role !== "admin" && !ctx.tenantIds.includes(tenantId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: tenant, error } = await supabase
    .from("tenants")
    .select(
      "config, app_type, repo_url, business_name, expo_project_id, supabase_url, supabase_anon_key, updated_at",
    )
    .eq("id", tenantId)
    .single();

  if (error || !tenant) {
    return NextResponse.json(
      { error: error?.message ?? "Tenant not found" },
      { status: 404 },
    );
  }

  const { data: builds } = await supabase
    .from("builds")
    .select("profile, config_hash, created_at")
    .eq("tenant_id", tenantId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ tenant, builds: builds ?? [] });
}
