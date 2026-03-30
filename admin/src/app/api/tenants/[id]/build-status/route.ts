import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkflowRun } from "@/lib/github";

function mapGitHubStatus(
  status: string,
  conclusion: string | null
): string {
  if (status === "queued" || status === "waiting" || status === "pending") {
    return "queued";
  }
  if (status === "in_progress") {
    return "building";
  }
  if (status === "completed") {
    if (conclusion === "success") return "completed";
    if (conclusion === "failure") return "failed";
    if (conclusion === "cancelled") return "cancelled";
    return "failed"; // fallback for other conclusions
  }
  return "pending";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;
    const buildId = request.nextUrl.searchParams.get("build_id");

    if (!buildId) {
      return NextResponse.json(
        { error: "build_id query parameter is required" },
        { status: 400 }
      );
    }

    // Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load build record
    const { data: build, error: buildError } = await supabase
      .from("builds")
      .select("id, tenant_id, status, workflow_run_id, build_url")
      .eq("id", buildId)
      .eq("tenant_id", tenantId)
      .single();

    if (buildError || !build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    let status = build.status;
    let conclusion: string | null = null;
    let buildUrl = build.build_url;
    let updated = false;

    // If the build has a workflow_run_id, fetch live status from GitHub
    if (build.workflow_run_id) {
      try {
        const run = await getWorkflowRun(build.workflow_run_id);
        conclusion = run.conclusion;
        const newStatus = mapGitHubStatus(run.status, run.conclusion);
        buildUrl = run.html_url;

        if (newStatus !== build.status || buildUrl !== build.build_url) {
          await supabase
            .from("builds")
            .update({ status: newStatus, build_url: buildUrl })
            .eq("id", buildId);
          status = newStatus;
          updated = true;
        }
      } catch (err) {
        console.warn("Failed to fetch workflow run status:", err);
        // Return the stored status as fallback
      }
    }

    return NextResponse.json({ status, conclusion, build_url: buildUrl, updated });
  } catch (error) {
    console.error("build-status error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
