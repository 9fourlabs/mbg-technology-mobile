import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { configToTypeScript } from "@/lib/config-generator";
import { commitTenantConfig, createTenantPullRequest } from "@/lib/github";
import type { AppTemplate } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;
    const { config } = (await request.json()) as { config: AppTemplate };

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

    // Load tenant to get template_type
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, template_type")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: tenantError?.message ?? "Tenant not found" },
        { status: 404 }
      );
    }

    // Update config in Supabase
    const { error: updateError } = await supabase
      .from("tenants")
      .update({ config })
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

    return NextResponse.json({ success: true, pr_url, pr_number });
  } catch (err) {
    console.error("save-config error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
