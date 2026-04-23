import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getExpoBuildPageUrl } from "@/lib/eas";
import { hashConfig } from "@/lib/config-hash";
import DeployButtons from "./deploy-buttons";
import BuildStatusPoller from "./build-status-poller";
import BuildArtifacts from "./build-artifacts";
import RetryBuildButton from "./retry-build-button";
import SharePreviewLink from "../share-preview-link";
import TenantTabBar from "@/components/TenantTabBar";

function formatDuration(created: string, updated: string | null) {
  if (!updated) return "-";
  const start = new Date(created).getTime();
  const end = new Date(updated).getTime();
  const diffMs = end - start;
  if (diffMs < 0) return "-";
  const mins = Math.floor(diffMs / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export default async function BuildsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, business_name, expo_project_id, status, config, app_type")
    .eq("id", id)
    .single();

  if (!tenant) {
    notFound();
  }

  // Compute production readiness
  const config = tenant.config as Record<string, unknown> | null;
  const brand = (config?.brand ?? {}) as Record<string, string>;
  const tabs = (config?.tabs ?? []) as unknown[];

  const { count: successfulPreviews } = await supabase
    .from("builds")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", id)
    .eq("profile", "preview")
    .eq("status", "completed");

  const missingRequirements: string[] = [];
  if (!config || tabs.length === 0) missingRequirements.push("App settings configured");
  if (!brand.primaryColor) missingRequirements.push("Brand colors set");
  if (!tenant.expo_project_id) missingRequirements.push("Expo Project ID not set");
  if ((successfulPreviews ?? 0) === 0) missingRequirements.push("No successful preview build");

  const { data: builds } = await supabase
    .from("builds")
    .select("*, updated_at, error_message, download_url_ios, config_hash")
    .eq("tenant_id", id)
    .order("created_at", { ascending: false });

  const hasExpoProject = !!tenant.expo_project_id;
  const expoBuildsUrl = getExpoBuildPageUrl();

  // Compare the current draft config hash against the most recent successful
  // build per profile so we can surface "unpublished changes" on the CTAs.
  const draftHash = await hashConfig(tenant.config ?? {});
  const latestPreview = builds?.find(
    (b) => b.profile === "preview" && b.status === "completed"
  );
  const latestProduction = builds?.find(
    (b) => b.profile === "production" && b.status === "completed"
  );
  const previewDirty =
    !!latestPreview?.config_hash && latestPreview.config_hash !== draftHash;
  const productionDirty =
    !!latestProduction?.config_hash &&
    latestProduction.config_hash !== draftHash;
  const previewNeverBuilt = !latestPreview;

  return (
    <div>
      <TenantTabBar tenantId={id} tenantName={tenant.business_name || id} appType={(tenant as any).app_type} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Builds</h1>
        <div className="flex items-center gap-3">
          <SharePreviewLink tenantId={id} hasPreviewBuild={(successfulPreviews ?? 0) > 0} />
          <DeployButtons
            tenantId={id}
            hasExpoProject={hasExpoProject}
            missingRequirements={missingRequirements}
            previewDirty={previewDirty || previewNeverBuilt}
            productionDirty={productionDirty}
          />
        </div>
      </div>

      {/* ── Pending-changes banner ── */}
      {(previewDirty || productionDirty) && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-6">
          <p className="text-sm font-medium text-amber-800 mb-1">
            Unpublished changes
          </p>
          <p className="text-sm text-amber-700">
            {previewDirty && productionDirty
              ? "The current config differs from both the latest preview and production builds. Create a new preview to see the changes live."
              : previewDirty
              ? "The current config differs from the latest preview build. Create a new preview to push these changes."
              : "The current config differs from what's live in production. Create a preview first, then go live to ship the changes."}
          </p>
        </div>
      )}

      {/* ── Next-steps banner ── */}
      {builds && builds.length > 0 && builds[0].status === "completed" && builds[0].profile === "preview" && (
        <div className="rounded-lg bg-emerald-50 border border-green-200 p-4 mb-6">
          <p className="text-sm font-medium text-emerald-800 mb-1">Preview ready!</p>
          <p className="text-sm text-emerald-700">
            Share it with your client using the <strong>Share</strong> button above. They can try the app in their browser or install it on their device.
          </p>
        </div>
      )}
      {builds && builds.length > 0 && builds[0].status === "completed" && builds[0].profile === "production" && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 mb-6">
          <p className="text-sm font-medium text-blue-800 mb-1">Production build ready!</p>
          <p className="text-sm text-blue-700 mb-2">
            Download the build artifacts above, then submit to the app stores:
          </p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>
              • <a href="https://appstoreconnect.apple.com" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-blue-900">Apple App Store Connect</a> (iOS)
            </li>
            <li>
              • <a href="https://play.google.com/console" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-blue-900">Google Play Console</a> (Android)
            </li>
          </ul>
        </div>
      )}
      {builds && builds.length > 0 && builds[0].status === "failed" && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
          <p className="text-sm font-medium text-red-800 mb-1">Build failed</p>
          <p className="text-sm text-red-700">
            {builds[0].error_message || "Check the build log for details."}{" "}
            {builds[0].build_url && (
              <a href={builds[0].build_url} target="_blank" rel="noopener noreferrer" className="underline font-medium">
                View build log
              </a>
            )}
          </p>
        </div>
      )}

      {/* Build types explainer */}
      <div className="rounded-xl bg-white border border-gray-200 p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Build Types
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-50 border border-gray-300 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                Preview
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Creates a test version of the app that can be installed directly on
              Android and iOS devices. Use this to demo the app to your client
              before going live. Share the install link or scan the QR code.
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-300 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                Production
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Submits the app to the App Store (iOS) and Google Play (Android).
              This is the final step — only do this after your client has approved
              the preview.
            </p>
          </div>
        </div>
      </div>

      {!hasExpoProject && (
        <div className="rounded-lg bg-amber-50 border border-yellow-200 px-4 py-3 text-sm text-amber-700 mb-6">
          Production deploys require an Expo project ID. Configure one in the
          tenant settings.
        </div>
      )}

      {/* Build History */}
      <div className="rounded-xl bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Build History</h2>
        </div>
        {builds && builds.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Downloads</th>
                <th className="px-6 py-3 font-medium">Started</th>
                <th className="px-6 py-3 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {builds.map((build) => (
                <tr key={build.id} className="text-sm">
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      build.profile === "production"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {build.profile === "production" ? "Production" : "Preview"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <BuildStatusPoller
                      build={{
                        id: build.id,
                        status: build.status,
                        workflow_run_id: build.workflow_run_id,
                      }}
                      tenantId={id}
                    />
                    {build.status === "failed" && build.error_message && (
                      <p className="text-xs text-red-600 mt-1 truncate max-w-[200px]" title={build.error_message}>
                        {build.error_message}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {build.status === "completed" && build.download_url ? (
                      <div className="flex items-center gap-2">
                        <a href={build.download_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-medium text-blue-600 hover:text-blue-700">APK</a>
                        {build.download_url_ios && (
                          <a href={build.download_url_ios} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-medium text-blue-600 hover:text-blue-700">iOS</a>
                        )}
                        <BuildArtifacts
                          downloadUrl={build.download_url}
                          downloadUrlIos={build.download_url_ios}
                          buildId={build.id}
                        />
                      </div>
                    ) : build.status === "completed" ? (
                      <BuildStatusPoller
                        build={{ id: build.id, status: build.status, workflow_run_id: build.workflow_run_id }}
                        tenantId={id}
                        artifactsOnly
                      />
                    ) : build.status === "failed" ? (
                      <RetryBuildButton tenantId={id} profile={build.profile} />
                    ) : (
                      <span className="text-gray-400">&mdash;</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-500">
                    {new Date(build.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-gray-500">
                    {formatDuration(build.created_at, build.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No builds yet. Click &ldquo;Create Preview&rdquo; to start your
            first build.
          </div>
        )}
      </div>
    </div>
  );
}
