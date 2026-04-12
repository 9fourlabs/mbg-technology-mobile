import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { triggerWorkflowDispatch, getLatestWorkflowRun, commitTenantConfigToMain } from "@/lib/github";
import { configToTypeScript } from "@/lib/config-generator";
import type { AppTemplate } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;

    // Authenticate the user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const { profile } = body;

    if (!profile || !["preview", "production"].includes(profile)) {
      return NextResponse.json(
        { error: "Invalid profile. Must be 'preview' or 'production'." },
        { status: 400 }
      );
    }

    // Load tenant
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, expo_project_id, template_type, app_version, app_type, repo_url, repo_branch, config")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Production builds require an expo_project_id
    if (profile === "production" && !tenant.expo_project_id) {
      return NextResponse.json(
        {
          error:
            "Production builds require an Expo project ID. Configure one in the tenant settings.",
        },
        { status: 400 }
      );
    }

    const appVersion = (tenant as Record<string, unknown>).app_version as string ?? "1.0.0";
    const isCustom = (tenant as Record<string, unknown>).app_type === "custom";

    // Pre-build validation for template apps
    if (!isCustom && profile === "preview") {
      const config = tenant.config as Record<string, unknown> | null;
      const issues: string[] = [];

      if (!config || Object.keys(config).length === 0) {
        issues.push("App has no configuration. Go to Design to set up your app.");
      } else {
        const brand = config.brand as Record<string, string> | undefined;
        const tabs = config.tabs as unknown[] | undefined;

        if (!brand?.logoUrl && !brand?.logoUri) {
          issues.push("Missing logo. Upload one in the Brand tab.");
        }
        if (!tabs || tabs.length === 0) {
          issues.push("No pages configured. Add at least one page in the Pages tab.");
        }
      }

      if (issues.length > 0) {
        return NextResponse.json(
          { error: "App not ready for preview", details: issues },
          { status: 400 }
        );
      }
    }

    // For template apps: ensure config JSON is committed to main before building
    if (!isCustom && tenant.config && Object.keys(tenant.config as object).length > 0) {
      try {
        const config = tenant.config as AppTemplate;
        const tsContent = configToTypeScript(tenantId, config);
        const jsonContent = JSON.stringify(config, null, 2);
        await commitTenantConfigToMain(tenantId, tsContent, jsonContent);
      } catch (err) {
        console.warn("Failed to commit config to main (build may use stale config):", err);
        // Non-fatal: proceed with the build anyway
      }
    }

    // Create build record FIRST so we have a UUID to pass through the pipeline
    const { data: build, error: buildError } = await supabase
      .from("builds")
      .insert({
        tenant_id: tenantId,
        profile,
        status: "pending",
        platform: "all",
        app_version: appVersion,
      })
      .select("id")
      .single();

    if (buildError) {
      console.error("Failed to insert build record:", buildError);
      return NextResponse.json(
        { error: "Failed to create build record." },
        { status: 500 }
      );
    }

    const adminBuildId = build.id;

    // Custom app path — dispatch the custom workflow with repo info
    let workflowFile: string;

    if (isCustom) {
      const repoUrl = (tenant as Record<string, unknown>).repo_url as string;
      const repoBranch = ((tenant as Record<string, unknown>).repo_branch as string) ?? "main";

      if (!repoUrl) {
        return NextResponse.json(
          { error: "Custom app has no repo URL configured." },
          { status: 400 }
        );
      }

      workflowFile = "eas-custom.yml";
      await triggerWorkflowDispatch(workflowFile, "main", {
        repo_url: repoUrl,
        branch: repoBranch,
        profile,
        version: appVersion,
        expo_project_id: tenant.expo_project_id ?? "",
        build_id: adminBuildId,
        tenant_id: tenantId,
      });
    } else {
      // Template app path
      workflowFile =
        profile === "preview" ? "eas-preview.yml" : "eas-promote.yml";

      if (profile === "preview") {
        await triggerWorkflowDispatch(workflowFile, "main", {
          tenant: tenantId,
          version: appVersion,
          build_id: adminBuildId,
        });
      } else {
        await triggerWorkflowDispatch(workflowFile, "main", {
          tenant: tenantId,
          platform: "all",
          version: appVersion,
          build_id: adminBuildId,
        });
      }
    }

    // Wait briefly for GitHub to register the run, then update the build record
    const dispatchedAt = new Date();
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const latestRun = await getLatestWorkflowRun(workflowFile, dispatchedAt);
      if (latestRun) {
        await supabase
          .from("builds")
          .update({
            workflow_run_id: String(latestRun.id),
            build_url: latestRun.html_url,
          })
          .eq("id", adminBuildId);
      }
    } catch (err) {
      console.warn("Failed to capture workflow run ID:", err);
    }

    return NextResponse.json({
      success: true,
      build_id: adminBuildId,
      message: `${profile === "preview" ? "Preview" : "Production"} build triggered successfully.`,
    });
  } catch (error) {
    console.error("trigger-build error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
