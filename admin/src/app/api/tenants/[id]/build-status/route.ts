import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkflowRun, getFailureReason } from "@/lib/github";
import { getExpoBuildPageUrl, getExpoInstallUrl, getEASBuilds } from "@/lib/eas";

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
      .select("id, tenant_id, status, workflow_run_id, build_url, error_message, created_at")
      .eq("id", buildId)
      .eq("tenant_id", tenantId)
      .single();

    if (buildError || !build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    let status = build.status;
    let conclusion: string | null = null;
    let buildUrl = build.build_url;
    let errorMessage: string | null = build.error_message ?? null;
    let updated = false;

    // If the build has a workflow_run_id, fetch live status from GitHub
    if (build.workflow_run_id) {
      try {
        const run = await getWorkflowRun(build.workflow_run_id);
        conclusion = run.conclusion;
        const newStatus = mapGitHubStatus(run.status, run.conclusion);
        buildUrl = run.html_url;

        if (newStatus !== build.status || buildUrl !== build.build_url) {
          const updateFields: Record<string, unknown> = {
            status: newStatus,
            build_url: buildUrl,
          };

          // Persist updated_at when reaching a terminal state
          const isTerminal = ["completed", "failed", "cancelled"].includes(newStatus);
          if (isTerminal) {
            updateFields.updated_at = new Date().toISOString();
          }

          // Fetch failure reason when build fails
          if (newStatus === "failed" && !errorMessage) {
            const reason = await getFailureReason(build.workflow_run_id);
            if (reason) {
              errorMessage = reason;
              updateFields.error_message = reason;
            }
          }

          await supabase
            .from("builds")
            .update(updateFields)
            .eq("id", buildId);
          status = newStatus;
          updated = true;
        }
      } catch (err) {
        console.warn("Failed to fetch workflow run status:", err);
        // Return the stored status as fallback
      }
    }

    const easBuildsUrl = status === "completed" ? getExpoBuildPageUrl() : null;

    // Try to find download URLs from EAS when the build is completed
    let downloadUrl: string | null = null;
    let downloadUrlIos: string | null = null;

    // First check the DB record
    const { data: freshBuild } = await supabase
      .from("builds")
      .select("download_url, download_url_ios")
      .eq("id", buildId)
      .single();
    downloadUrl = freshBuild?.download_url ?? null;
    downloadUrlIos = freshBuild?.download_url_ios ?? null;

    // If completed and missing either URL, try fetching from EAS
    // Match EAS builds by timestamp — find the closest EAS build to this admin build's created_at
    if (status === "completed" && (!downloadUrl || !downloadUrlIos)) {
      try {
        const easBuilds = await getEASBuilds(20);
        const updateFields: Record<string, string> = {};
        const buildCreatedAt = new Date(build.created_at).getTime();

        // Only consider EAS builds within 30 minutes of the admin build trigger
        const MAX_TIME_DIFF = 30 * 60 * 1000;

        // Find the closest matching Android build by timestamp
        if (!downloadUrl) {
          const androidCandidates = easBuilds
            .filter((b) => b.status === "finished" && b.platform === "android" && b.downloadUrl)
            .map((b) => ({ ...b, timeDiff: Math.abs(new Date(b.createdAt).getTime() - buildCreatedAt) }))
            .filter((b) => b.timeDiff < MAX_TIME_DIFF)
            .sort((a, c) => a.timeDiff - c.timeDiff);

          if (androidCandidates.length > 0 && androidCandidates[0].downloadUrl) {
            downloadUrl = androidCandidates[0].downloadUrl;
            updateFields.download_url = downloadUrl;
          }
        }

        // Find the closest matching iOS build by timestamp
        if (!downloadUrlIos) {
          const iosCandidates = easBuilds
            .filter((b) => b.status === "finished" && b.platform === "ios")
            .map((b) => ({ ...b, timeDiff: Math.abs(new Date(b.createdAt).getTime() - buildCreatedAt) }))
            .filter((b) => b.timeDiff < MAX_TIME_DIFF)
            .sort((a, c) => a.timeDiff - c.timeDiff);

          if (iosCandidates.length > 0) {
            // Use Expo install page URL (handles itms-services:// for iOS OTA install)
            downloadUrlIos = getExpoInstallUrl(iosCandidates[0].id);
            updateFields.download_url_ios = downloadUrlIos;
          }
        }

        if (Object.keys(updateFields).length > 0) {
          await supabase
            .from("builds")
            .update(updateFields)
            .eq("id", buildId);
        }
      } catch (err) {
        console.warn("Failed to fetch EAS builds for download URL:", err);
      }
    }

    // Fallback: if completed but still no download URL, provide the Expo install page
    const expoInstallUrl = status === "completed"
      ? getExpoInstallUrl(buildId)
      : null;

    return NextResponse.json({
      status,
      conclusion,
      build_url: buildUrl,
      eas_builds_url: easBuildsUrl,
      download_url: downloadUrl,
      download_url_ios: downloadUrlIos,
      expo_install_url: expoInstallUrl,
      error_message: errorMessage,
      updated,
    });
  } catch (error) {
    console.error("build-status error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
