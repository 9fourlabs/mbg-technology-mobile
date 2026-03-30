import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BuildStatusPoller from "./builds/build-status-poller";
import DeployPreviewButton from "./deploy-preview-button";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-gray-700 text-gray-300",
    preview: "bg-yellow-900/50 text-yellow-400",
    production: "bg-green-900/50 text-green-400",
    pending: "bg-blue-900/50 text-blue-400",
    building: "bg-yellow-900/50 text-yellow-400",
    completed: "bg-green-900/50 text-green-400",
    failed: "bg-red-900/50 text-red-400",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] ?? "bg-gray-700 text-gray-300"}`}
    >
      {status}
    </span>
  );
}

const templateColors: Record<string, string> = {
  informational: "bg-gray-900/50 text-gray-400",
  authenticated: "bg-blue-900/50 text-blue-400",
  booking: "bg-green-900/50 text-green-400",
  commerce: "bg-yellow-900/50 text-yellow-400",
  loyalty: "bg-purple-900/50 text-purple-400",
  content: "bg-orange-900/50 text-orange-400",
  forms: "bg-teal-900/50 text-teal-400",
  directory: "bg-indigo-900/50 text-indigo-400",
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
        <Link href="/tenants" className="hover:text-white transition-colors">
          Tenants
        </Link>
        <span>/</span>
        <span className="text-white">{tenant.business_name || id}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">
              {tenant.business_name || id}
            </h1>
            <StatusBadge status={tenant.status} />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-500 font-mono">{id}</span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${templateColors[tenant.template_type] ?? "bg-gray-700 text-gray-300"}`}
            >
              {tenant.template_type}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8 p-4 rounded-xl bg-gray-900 border border-gray-800">
        <Link
          href={`/tenants/${id}/config`}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          Edit Config
        </Link>
        <Link
          href={`/tenants/${id}/content`}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          Manage Content
        </Link>
        <Link
          href={`/tenants/${id}/builds`}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          View Builds
        </Link>
        <DeployPreviewButton tenantId={id} />
      </div>

      {/* What's Next? Guidance Card */}
      <div className="rounded-xl border border-gray-800 bg-[#2563EB]/5 p-5 mb-8">
        <h2 className="text-sm font-semibold text-[#2563EB] mb-2">
          What&apos;s Next?
        </h2>
        {tenant.status === "draft" && (
          <p className="text-sm text-gray-300 leading-relaxed">
            This app hasn&apos;t been built yet. Click{" "}
            <strong className="text-white">Edit Config</strong> to customize the
            branding, then{" "}
            <strong className="text-white">Deploy Preview</strong> to create a
            preview version your client can install and try.
          </p>
        )}
        {tenant.status === "preview" && (
          <p className="text-sm text-gray-300 leading-relaxed">
            A preview build is available! Share the install link with your
            client for approval. Once they&apos;re happy, go to{" "}
            <Link
              href={`/tenants/${id}/builds`}
              className="text-[#2563EB] hover:underline font-medium"
            >
              View Builds
            </Link>{" "}
            and deploy to production to submit it to the app stores.
          </p>
        )}
        {tenant.status === "production" && (
          <p className="text-sm text-gray-300 leading-relaxed">
            This app is live in the app stores. Any config changes will need a
            new build to take effect. Use{" "}
            <strong className="text-white">Edit Config</strong> to make
            updates, then trigger a new build when ready.
          </p>
        )}
        {tenant.status !== "draft" &&
          tenant.status !== "preview" &&
          tenant.status !== "production" && (
            <p className="text-sm text-gray-300 leading-relaxed">
              Use the action buttons above to configure and build this app.
            </p>
          )}
      </div>

      {/* App Overview: Brand + Config Summary */}
      <h2 className="text-lg font-semibold text-white mb-4">App Overview</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Brand Preview */}
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
          <h3 className="text-base font-semibold text-white mb-4">Brand</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 w-24">Primary</span>
              <div
                className="w-8 h-8 rounded border border-gray-700"
                style={{ backgroundColor: brand.primaryColor ?? "#2563EB" }}
              />
              <span className="text-sm text-gray-300 font-mono">
                {brand.primaryColor ?? "not set"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 w-24">Background</span>
              <div
                className="w-8 h-8 rounded border border-gray-700"
                style={{ backgroundColor: brand.backgroundColor ?? "#000000" }}
              />
              <span className="text-sm text-gray-300 font-mono">
                {brand.backgroundColor ?? "not set"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 w-24">Text</span>
              <div
                className="w-8 h-8 rounded border border-gray-700"
                style={{ backgroundColor: brand.textColor ?? "#FFFFFF" }}
              />
              <span className="text-sm text-gray-300 font-mono">
                {brand.textColor ?? "not set"}
              </span>
            </div>
            {brand.logoUrl && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-24">Logo</span>
                <img
                  src={brand.logoUrl}
                  alt="Logo"
                  className="w-10 h-10 rounded-lg object-cover border border-gray-700"
                />
              </div>
            )}
          </div>
        </div>

        {/* Config Summary */}
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
          <h3 className="text-base font-semibold text-white mb-4">
            Config Summary
          </h3>
          <div className="space-y-0">
            <div className="flex justify-between py-2.5 border-b border-gray-800">
              <span className="text-sm text-gray-400">Template</span>
              <span className="text-sm text-white capitalize">
                {tenant.template_type}
              </span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-800">
              <span className="text-sm text-gray-400">Design Preset</span>
              <span className="text-sm text-white">
                {(design.preset as string) ?? "default"}
              </span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-gray-800">
              <span className="text-sm text-gray-400">Tabs</span>
              <span className="text-sm text-white">{tabs.length} configured</span>
            </div>
            {tenant.template_type === "authenticated" && (
              <div className="flex justify-between py-2.5 border-b border-gray-800">
                <span className="text-sm text-gray-400">Protected Tabs</span>
                <span className="text-sm text-white">{protectedTabs}</span>
              </div>
            )}
            <div className="flex justify-between py-2.5 border-b border-gray-800">
              <span className="text-sm text-gray-400">Supabase Project</span>
              <span className="text-sm">
                {tenant.supabase_project_id ? (
                  <a
                    href={`https://supabase.com/dashboard/project/${tenant.supabase_project_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2563EB] hover:underline"
                  >
                    {tenant.supabase_project_id}
                  </a>
                ) : (
                  <span className="text-gray-500">Not configured</span>
                )}
              </span>
            </div>
            {tenant.expo_project_id && (
              <div className="flex justify-between py-2.5 border-b border-gray-800">
                <span className="text-sm text-gray-400">Expo Project ID</span>
                <span className="text-sm text-white font-mono text-xs">
                  {tenant.expo_project_id}
                </span>
              </div>
            )}
            <div className="flex justify-between py-2.5">
              <span className="text-sm text-gray-400">Created</span>
              <span className="text-sm text-white">
                {new Date(tenant.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Build */}
      <h2 className="text-lg font-semibold text-white mb-4">Latest Build</h2>
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-6 mb-8">
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
                      ? "bg-green-900/50 text-green-400"
                      : "bg-yellow-900/50 text-yellow-400"
                  }`}
                >
                  {latestBuild.profile}
                </span>
              </div>

              {/* Platform */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Platform:</span>
                <span className="text-sm text-gray-300">
                  {latestBuild.platform ?? "android"}
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500">Date:</span>
                <span className="text-sm text-gray-300">
                  {new Date(latestBuild.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Artifacts */}
            <div className="flex items-center gap-3">
              {latestBuild.status === "completed" && latestBuild.download_url ? (
                <a
                  href={latestBuild.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-xs font-medium text-white transition-colors"
                >
                  Download APK
                </a>
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
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  View on Expo
                </a>
              )}
              <Link
                href={`/tenants/${id}/builds`}
                className="text-xs text-[#2563EB] hover:underline"
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
      <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
      <div className="rounded-xl bg-gray-900 border border-gray-800 mb-8">
        <div className="px-6 py-4">
          {activity && activity.length > 0 ? (
            <div className="space-y-4">
              {activity.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-[#2563EB] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300">
                      <span className="font-medium text-white">
                        {entry.action}
                      </span>
                    </p>
                    {entry.details && (
                      <p className="text-gray-500 truncate">{entry.details}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-0.5">
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
      <div className="rounded-xl border border-gray-800 border-dashed p-6">
        <h2 className="text-sm font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-xs text-gray-500 mb-4">
          Destructive actions that cannot be undone.
        </p>
        <button
          disabled
          className="px-4 py-2 rounded-lg border border-red-800/50 text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors cursor-not-allowed opacity-60"
          title="Deletion is not yet implemented"
        >
          Delete Tenant
        </button>
      </div>
    </div>
  );
}
