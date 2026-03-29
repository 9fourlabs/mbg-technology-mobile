import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { triggerWorkflowDispatch } from "@/lib/github";

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
    if (profile === "preview") {
      await triggerWorkflowDispatch("eas-preview.yml", "main", {
        tenant: tenantId,
      });
    } else {
      await triggerWorkflowDispatch("eas-promote.yml", "main", {
        tenant: tenantId,
        platform: "all",
      });
    }

    // Insert build record
    const { data: build, error: buildError } = await supabase
      .from("builds")
      .insert({
        tenant_id: tenantId,
        profile,
        status: "pending",
        platform: "all",
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
