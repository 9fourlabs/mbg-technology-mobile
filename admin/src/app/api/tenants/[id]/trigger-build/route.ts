import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { triggerWorkflowDispatch, getLatestWorkflowRun } from "@/lib/github";

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
      .select("id, expo_project_id, template_type")
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

    // Trigger the appropriate GitHub Actions workflow
    const workflowFile =
      profile === "preview" ? "eas-preview.yml" : "eas-promote.yml";

    if (profile === "preview") {
      await triggerWorkflowDispatch(workflowFile, "main", {
        tenant: tenantId,
      });
    } else {
      await triggerWorkflowDispatch(workflowFile, "main", {
        tenant: tenantId,
        platform: "all",
      });
    }

    // Wait briefly for GitHub to register the run, then capture it
    let workflowRunId: string | null = null;
    let buildUrl: string | null = null;

    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const latestRun = await getLatestWorkflowRun(workflowFile);
      if (latestRun) {
        workflowRunId = String(latestRun.id);
        buildUrl = latestRun.html_url;
      }
    } catch (err) {
      console.warn("Failed to capture workflow run ID:", err);
      // Non-fatal: build record will still be created without the run ID
    }

    // Insert build record
    const { data: build, error: buildError } = await supabase
      .from("builds")
      .insert({
        tenant_id: tenantId,
        profile,
        status: "pending",
        platform: "all",
        workflow_run_id: workflowRunId,
        build_url: buildUrl,
      })
      .select("id")
      .single();

    if (buildError) {
      console.error("Failed to insert build record:", buildError);
      return NextResponse.json(
        { error: "Build was triggered but failed to save the build record." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      build_id: build.id,
      message: `${profile === "preview" ? "Preview" : "Production"} build triggered successfully.`,
    });
  } catch (error) {
    console.error("trigger-build error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
