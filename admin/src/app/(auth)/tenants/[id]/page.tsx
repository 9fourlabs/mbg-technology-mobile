import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BuildStatusPoller from "./builds/build-status-poller";
import DeployPreviewButton from "./deploy-preview-button";
import SharePreviewLink from "./share-preview-link";
import ReadinessChecklist from "./readiness-checklist";
import VersionBump from "./version-bump";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-gray-200 text-gray-500",
    preview: "bg-amber-50 text-amber-700",
    production: "bg-emerald-50 text-emerald-700",
    pending: "bg-blue-50 text-blue-700",
    building: "bg-amber-50 text-amber-700",
    completed: "bg-emerald-50 text-emerald-700",
    failed: "bg-red-50 text-red-600",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] ?? "bg-gray-200 text-gray-500"}`}
    >
      {status}
    </span>
  );
}

const templateColors: Record<string, string> = {
  informational: "bg-gray-50 text-gray-500",
  authenticated: "bg-blue-50 text-blue-600",
  booking: "bg-emerald-50 text-emerald-700",
  commerce: "bg-amber-50 text-amber-700",
  loyalty: "bg-purple-50 text-purple-600",
  content: "bg-orange-50 text-orange-600",
  forms: "bg-teal-50 text-teal-600",
  directory: "bg-indigo-50 text-indigo-600",
};

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !tenant) {
    notFound();
  }

  const isCustom = (tenant as Record<string, unknown>).app_type === "custom";
  const repoUrl = (tenant as Record<string, unknown>).repo_url as string | null;
  const repoBranch = ((tenant as Record<string, unknown>).repo_branch as string) ?? "main";

  const config = tenant.config as Record<string, unknown> | null;
  const brand = (config?.brand ?? {}) as Record<string, string>;
  const tabs = (config?.tabs ?? []) as Record<string, unknown>[];
  const design = (config?.design ?? {}) as Record<string, unknown>;

  // Count protected tabs (tabs with requiresAuth or protected flag)
  const protectedTabs = tabs.filter(
    (t) => t.requiresAuth === true || t.protected === true
  ).length;

  // Fetch recent builds (get more fields for latest build display)
  const { data: builds } = await supabase
    .from("builds")
    .select("*")
    .eq("tenant_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  const latestBuild = builds && builds.length > 0 ? builds[0] : null;

  // Fetch activity
  const { data: activity } = await supabase
    .from("activity_log")
    .select("id, action, details, created_at, user_email")
    .eq("tenant_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/tenants" className="hover:text-gray-900 transition-colors">
          Tenants
        </Link>
        <span>/</span>
        <span className="text-gray-900">{tenant.business_name || id}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">
              {tenant.business_name || id}
            </h1>
            <StatusBadge status={tenant.status} />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-500 font-mono">{id}</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${templateColors[tenant.template_type] ?? "bg-gray-700 text-gray-500"}`}
            >
              {tenant.template_type}
            </span>
          </div>
        </div>
      </div>

      {/* Version */}
      <div className="mb-4">
        <VersionBump
          tenantId={id}
          currentVersion={(tenant as Record<string, unknown>).app_version as string ?? "1.0.0"}
        />
      </div>

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8 p-4 rounded-xl bg-white border border-gray-200">
        {!isCustom && (
          <Link
            href={`/tenants/${id}/config`}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 border border-gray-300 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
          >
            Edit Config
          </Link>
        )}
        {!isCustom && (
          <Link
            href={`/tenants/${id}/content`}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 border border-gray-300 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
          >
            Manage Content
          </Link>
        )}
        {isCustom && repoUrl && (
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 border border-gray-300 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
          >
            View Repo
          </a>
        )}
        <Link
          href={`/tenants/${id}/builds`}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 border border-gray-300 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
        >
          View Builds
        </Link>
        <DeployPreviewButton tenantId={id} />
        <SharePreviewLink tenantId={id} />
      </div>

      {/* What's Next? Guidance Card */}
      <div className="rounded-xl border border-gray-200 bg-blue-600/5 p-5 mb-8">
        <h2 className="text-sm font-semibold text-blue-600 mb-2">
          What&apos;s Next?
        </h2>
        {tenant.status === "draft" && (
          <p className="text-sm text-gray-500 leading-relaxed">
            {isCustom ? (
              <>
                This custom app hasn&apos;t been built yet. Make sure the repo has{" "}
                <strong className="text-gray-900">eas.json</strong> and{" "}
                <strong className="text-gray-900">app.config.ts</strong>, then click{" "}
                <strong className="text-gray-900">Deploy Preview</strong> to trigger
                your first build.
              </>
            ) : (
              <>
                This app hasn&apos;t been built yet. Click{" "}
                <strong className="text-gray-900">Edit Config</strong> to customize the
                branding, then{" "}
                <strong className="text-gray-900">Deploy Preview</strong> to create a
                preview version your client can install and try.
              </>
            )}
          </p>
        )}
        {tenant.status === "preview" && (
          <p className="text-sm text-gray-500 leading-relaxed">
            A preview build is available! Share the install link with your
            client for approval. Once they&apos;re happy, go to{" "}
            <Link
              href={`/tenants/${id}/builds`}
              className="text-blue-600 hover:underline font-medium"
            >
              View Builds
            </Link>{" "}
            and deploy to production to submit it to the app stores.
          </p>
        )}
        {tenant.status === "production" && (
          <p className="text-sm text-gray-500 leading-relaxed">
            {isCustom ? (
              <>
                This app is live in the app stores. Push code changes to the
                repo, then trigger a new build from{" "}
                <strong className="text-gray-900">View Builds</strong> when ready.
              </>
            ) : (
              <>
                This app is live in the app stores. Any config changes will need a
                new build to take effect. Use{" "}
                <strong className="text-gray-900">Edit Config</strong> to make
                updates, then trigger a new build when ready.
              </>
            )}
          </p>
        )}
        {tenant.status !== "draft" &&
          tenant.status !== "preview" &&
          tenant.status !== "production" && (
            <p className="text-sm text-gray-500 leading-relaxed">
              Use the action buttons above to configure and build this app.
            </p>
          )}
      </div>

      {/* Production Readiness Checklist */}
      <ReadinessChecklist tenantId={id} />

      {/* Custom App: Repository Info */}
      {isCustom && repoUrl && (
        <div className="rounded-xl bg-white border border-gray-200 p-6 mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Repository</h2>
          <div className="space-y-0">
            <div className="flex justify-between py-2.5 border-b border-gray-200">
              <span className="text-sm text-gray-500">Repo URL</span>
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline font-mono"
              >
                {repoUrl.replace("https://github.com/", "")}
              </a>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-200">
              <span className="text-sm text-gray-500">Branch</span>
              <span className="text-sm text-gray-900 font-mono">{repoBranch}</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-sm text-gray-500">Type</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-50 text-cyan-600">
                Custom App
              </span>
            </div>
          </div>
        </div>
      )}

      {/* App Overview: Brand + Config Summary (template only) */}
      {!isCustom && <h2 className="text-lg font-semibold text-gray-900 mb-4">App Overview</h2>}
      {!isCustom && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Brand Preview */}
        <div className="rounded-xl bg-white border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Brand</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 w-24">Primary</span>
              <div
                className="w-8 h-8 rounded border border-gray-300"
                style={{ backgroundColor: brand.primaryColor ?? "#2563EB" }}
              />
              <span className="text-sm text-gray-500 font-mono">
                {brand.primaryColor ?? "not set"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 w-24">Background</span>
              <div
                className="w-8 h-8 rounded border border-gray-300"
                style={{ backgroundColor: brand.backgroundColor ?? "#000000" }}
              />
              <span className="text-sm text-gray-500 font-mono">
                {brand.backgroundColor ?? "not set"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 w-24">Text</span>
              <div
                className="w-8 h-8 rounded border border-gray-300"
                style={{ backgroundColor: brand.textColor ?? "#FFFFFF" }}
              />
              <span className="text-sm text-gray-500 font-mono">
                {brand.textColor ?? "not set"}
              </span>
            </div>
            {brand.logoUrl && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-24">Logo</span>
                <img
                  src={brand.logoUrl}
                  alt="Logo"
                  className="w-10 h-10 rounded-lg object-cover border border-gray-300"
                />
              </div>
            )}
          </div>
        </div>

        {/* Config Summary */}
        <div className="rounded-xl bg-white border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Config Summary
          </h3>
          <div className="space-y-0">
            <div className="flex justify-between py-2.5 border-b border-gray-200">
              <span className="text-sm text-gray-500">Template</span>
              <span className="text-sm text-gray-900 capitalize">
                {tenant.template_type}
              </span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-200">
              <span className="text-sm text-gray-500">Design Preset</span>
              <span className="text-sm text-gray-900">
                {(design.preset as string) ?? "default"}
              </span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-200">
              <span className="text-sm text-gray-500">Tabs</span>
              <span className="text-sm text-gray-900">{tabs.length} configured</span>
            </div>
            {tenant.template_type === "authenticated" && (
              <div className="flex justify-between py-2.5 border-b border-gray-200">
                <span className="text-sm text-gray-500">Protected Tabs</span>
                <span className="text-sm text-gray-900">{protectedTabs}</span>
              </div>
            )}
            <div className="flex justify-between py-2.5 border-b border-gray-200">
              <span className="text-sm text-gray-500">Supabase Project</span>
              <span className="text-sm">
                {tenant.supabase_project_id ? (
                  <a
                    href={`https://supabase.com/dashboard/project/${tenant.supabase_project_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {tenant.supabase_project_id}
                  </a>
                ) : (
                  <span className="text-gray-500">Not configured</span>
                )}
              </span>
            </div>
            {tenant.expo_project_id && (
              <div className="flex justify-between py-2.5 border-b border-gray-200">
                <span className="text-sm text-gray-500">Expo Project ID</span>
                <span className="text-sm text-gray-900 font-mono text-xs">
                  {tenant.expo_project_id}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2.5">
              <span className="text-sm text-gray-500">Created</span>
              <span className="text-sm text-gray-900">
                {new Date(tenant.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>}

      {/* Latest Build */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Latest Build</h2>
      <div className="rounded-xl bg-white border border-gray-200 p-6 mb-8">
        {latestBuild ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Status */}
              <div>
                {latestBuild.status === "pending" ||
                latestBuild.status === "building" ||
                latestBuild.status === "queued" ? (
                  <BuildStatusPoller
                    build={{
                      id: latestBuild.id,
                      status: latestBuild.status,
                      workflow_run_id: latestBuild.workflow_run_id,
                    }}
                    tenantId={id}
                  />
                ) : (
                  <StatusBadge status={latestBuild.status} />
                )}
              </div>

              {/* Profile */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Profile:</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    latestBuild.profile === "production"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {latestBuild.profile}
                </span>
              </div>

              {/* Platform */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Platform:</span>
                <span className="text-sm text-gray-500">
                  {latestBuild.platform ?? "android"}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Date:</span>
                <span className="text-sm text-gray-500">
                  {new Date(latestBuild.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Artifacts */}
            <div className="flex items-center gap-3">
              {latestBuild.status === "completed" && latestBuild.download_url ? (
                <div className="flex items-center gap-2">
                  <a
                    href={latestBuild.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white transition-colors"
                  >
                    APK
                  </a>
                  {latestBuild.download_url_ios && (
                    <a
                      href={latestBuild.download_url_ios}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white transition-colors"
                    >
                      iOS
                    </a>
                  )}
                </div>
              ) : latestBuild.status === "completed" ? (
                <BuildStatusPoller
                  build={{
                    id: latestBuild.id,
                    status: latestBuild.status,
                    workflow_run_id: latestBuild.workflow_run_id,
                  }}
                  tenantId={id}
                  artifactsOnly
                />
              ) : null}
              {latestBuild.build_url && (
                <a
                  href={latestBuild.build_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                >
                  View on Expo
                </a>
              )}
              <Link
                href={`/tenants/${id}/builds`}
                className="text-xs text-blue-600 hover:underline"
              >
                All builds
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              No builds yet. Deploy a preview to get started.
            </p>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
      <div className="rounded-xl bg-white border border-gray-200 mb-8">
        <div className="px-6 py-4">
          {activity && activity.length > 0 ? (
            <div className="space-y-4">
              {activity.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-500">
                      <span className="font-medium text-gray-900">
                        {entry.action}
                      </span>
                    </p>
                    {entry.details && (
                      <p className="text-gray-500 truncate">{entry.details}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-0.5">
                      {entry.user_email} &middot;{" "}
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No activity recorded yet.
            </p>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-gray-200 border-dashed p-6">
        <h2 className="text-sm font-semibold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-xs text-gray-500 mb-4">
          Destructive actions that cannot be undone.
        </p>
        <button
          disabled
          className="px-4 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-not-allowed opacity-60"
          title="Deletion is not yet implemented"
        >
          Delete Tenant
        </button>
      </div>
    </div>
  );
}
