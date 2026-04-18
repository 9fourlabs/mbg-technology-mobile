import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { configToTypeScript } from "@/lib/config-generator";
import {
  commitTenantConfig,
  createTenantPullRequest,
  updateTenantProjects,
} from "@/lib/github";
import type { AppTemplate } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;
    const body = (await request.json()) as {
      config: AppTemplate;
      expo_project_id?: string | null;
      supabase_url?: string | null;
      supabase_anon_key?: string | null;
      expected_updated_at?: string | null;
    };

    const { config, expo_project_id, supabase_url, supabase_anon_key, expected_updated_at } = body;

    if (!config) {
      return NextResponse.json(
        { error: "Missing config in request body" },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load tenant to get template_type and check concurrency
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, template_type, updated_at")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: tenantError?.message ?? "Tenant not found" },
        { status: 404 }
      );
    }

    // Optimistic concurrency check: if caller sent expected_updated_at and
    // the DB has a different value, someone else edited since they loaded.
    if (expected_updated_at && tenant.updated_at && tenant.updated_at !== expected_updated_at) {
      return NextResponse.json(
        { error: "This app was modified by someone else. Reload the page to see their changes." },
        { status: 409 }
      );
    }

    // Build update payload — always update config, optionally update tenant-level fields
    const updatePayload: Record<string, unknown> = { config };
    if (expo_project_id !== undefined) updatePayload.expo_project_id = expo_project_id;
    if (supabase_url !== undefined) updatePayload.supabase_url = supabase_url;
    if (supabase_anon_key !== undefined) updatePayload.supabase_anon_key = supabase_anon_key;

    // Update config in Supabase
    const { error: updateError } = await supabase
      .from("tenants")
      .update(updatePayload)
      .eq("id", tenantId);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update config: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Generate TypeScript and JSON content
    const tsContent = configToTypeScript(tenantId, config);
    const jsonContent = JSON.stringify(config, null, 2);

    // Commit to GitHub and open PR
    const { branch } = await commitTenantConfig(tenantId, tsContent, jsonContent);
    const { url: pr_url, number: pr_number } = await createTenantPullRequest(
      branch,
      tenantId,
      tenant.template_type
    );

    // If the user provided an Expo project ID, propagate it to the
    // committed scripts/tenantProjects.ts so production builds resolve
    // the right project. Without this, builds fall back to the placeholder
    // and `validateProductionReady.ts` rejects them. Failures are
    // non-fatal — the tenants table update above is still authoritative
    // for the admin UI.
    if (expo_project_id && expo_project_id.trim().length > 0) {
      try {
        await updateTenantProjects(tenantId, expo_project_id.trim());
      } catch (err) {
        console.warn(
          `Failed to update scripts/tenantProjects.ts for ${tenantId}:`,
          err
        );
      }
    }

    return NextResponse.json({ success: true, pr_url, pr_number });
  } catch (err) {
    console.error("save-config error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
