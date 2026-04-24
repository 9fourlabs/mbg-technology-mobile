import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getExpoInstallUrl } from "@/lib/eas";
import { getEASBuildById } from "@/lib/eas";
import { uploadToAppetize, updateAppetizeApp } from "@/lib/appetize";

/**
 * POST /api/tenants/[id]/build-link
 *
 * Called back by the GitHub Actions workflow after EAS builds complete.
 * Links the admin build record to the actual EAS build UUIDs so we can
 * fetch artifacts directly instead of guessing by timestamp.
 *
 * Auth: Bearer token via ADMIN_BUILD_LINK_SECRET (shared secret between
 * GitHub Actions and this API).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;

    // Authenticate via shared secret (GitHub Actions → Admin)
    const authHeader = request.headers.get("authorization");
    const expectedSecret = process.env.ADMIN_BUILD_LINK_SECRET;

    if (!expectedSecret) {
      console.error("ADMIN_BUILD_LINK_SECRET not configured");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { build_id, eas_build_id_android, eas_build_id_ios } = body;

    if (!build_id) {
      return NextResponse.json(
        { error: "build_id is required" },
        { status: 400 }
      );
    }

    // Use service role — this endpoint is called by GitHub Actions, not a browser
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Verify the build belongs to this tenant
    const { data: build, error: buildError } = await supabase
      .from("builds")
      .select("id, tenant_id")
      .eq("id", build_id)
      .eq("tenant_id", tenantId)
      .single();

    if (buildError || !build) {
      return NextResponse.json(
        { error: "Build not found for this tenant" },
        { status: 404 }
      );
    }

    // Build the update payload
    const updateFields: Record<string, unknown> = {};

    if (eas_build_id_android) {
      updateFields.eas_build_id_android = eas_build_id_android;

      // Fetch the actual download URL from EAS
      try {
        const easBuild = await getEASBuildById(eas_build_id_android);
        if (easBuild?.downloadUrl) {
          updateFields.download_url = easBuild.downloadUrl;
        }
      } catch (err) {
        console.warn("Failed to fetch Android build from EAS:", err);
      }
    }

    // Raw iOS artifact URL (simulator .tar.gz or .ipa) — needed for Appetize
    // upload below. Kept separate from download_url_ios which is the Expo
    // install page for real-device OTA installs.
    let iosArtifactUrl: string | null = null;

    if (eas_build_id_ios) {
      updateFields.eas_build_id_ios = eas_build_id_ios;
      // Expo install page for real-device OTA install. For preview builds
      // with `ios.simulator: true` this page surfaces the simulator .tar.gz
      // download; for ad-hoc builds it surfaces itms-services://.
      updateFields.download_url_ios = getExpoInstallUrl(eas_build_id_ios);

      // Fetch the raw artifact URL from EAS so we can upload to Appetize
      // directly (Appetize needs the archive URL, not the Expo install page).
      try {
        const easBuild = await getEASBuildById(eas_build_id_ios);
        if (easBuild?.downloadUrl) {
          iosArtifactUrl = easBuild.downloadUrl;
        }
      } catch (err) {
        console.warn("Failed to fetch iOS build from EAS:", err);
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: "No EAS build IDs provided" },
        { status: 400 }
      );
    }

    // Upload both platforms to Appetize.io for browser-based previews.
    // If the tenant already has an Appetize app for a given platform, update
    // it (keeps the same embed URL so share links stay stable); otherwise
    // create a new one.
    const { data: tenantRow } = await supabase
      .from("tenants")
      .select(
        "appetize_public_key, appetize_public_key_ios, business_name",
      )
      .eq("id", tenantId)
      .single();

    const label = `${tenantRow?.business_name ?? tenantId} — preview`;

    async function syncAppetize(
      artifactUrl: string,
      platform: "android" | "ios",
      existingKey: string | null | undefined,
    ): Promise<string | null> {
      if (!process.env.APPETIZE_API_KEY) return null;
      try {
        if (existingKey) {
          await updateAppetizeApp(existingKey, artifactUrl);
          return existingKey;
        }
        const key = await uploadToAppetize(artifactUrl, platform, label);
        await supabase
          .from("tenants")
          .update(
            platform === "android"
              ? { appetize_public_key: key }
              : { appetize_public_key_ios: key },
          )
          .eq("id", tenantId);
        return key;
      } catch (err) {
        // Non-fatal: share page falls back to QR code / direct install
        console.warn(
          `Appetize upload failed for ${platform} (share page will use fallback):`,
          err,
        );
        return null;
      }
    }

    if (updateFields.download_url) {
      const key = await syncAppetize(
        updateFields.download_url as string,
        "android",
        tenantRow?.appetize_public_key,
      );
      if (key) updateFields.appetize_public_key = key;
    }

    if (iosArtifactUrl) {
      const key = await syncAppetize(
        iosArtifactUrl,
        "ios",
        tenantRow?.appetize_public_key_ios,
      );
      if (key) updateFields.appetize_public_key_ios = key;
    }

    // Mark the build as completed now that EAS artifacts are linked
    updateFields.status = "completed";
    updateFields.updated_at = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("builds")
      .update(updateFields)
      .eq("id", build_id);

    if (updateError) {
      console.error("Failed to update build with EAS IDs:", updateError);
      return NextResponse.json(
        { error: "Failed to update build record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      linked: {
        build_id,
        eas_build_id_android: eas_build_id_android || null,
        eas_build_id_ios: eas_build_id_ios || null,
      },
    });
  } catch (error) {
    console.error("build-link error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
