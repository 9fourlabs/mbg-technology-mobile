import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BuildStatusPoller from "./builds/build-status-poller";
import DeployPreviewButton from "./deploy-preview-button";
import SharePreviewLink from "./share-preview-link";
import ReadinessChecklist from "./readiness-checklist";
import TenantTabBar from "@/components/TenantTabBar";

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

  // Fetch recent builds
  const { data: builds } = await supabase
    .from("builds")
    .select("*")
    .eq("tenant_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  const latestBuild = builds && builds.length > 0 ? builds[0] : null;

  // Onboarding step completion checks (for draft guidance card)
  const config = tenant.config as Record<string, unknown> | null;
  const brand = (config?.brand ?? {}) as Record<string, string>;
  const appStore = (config?.appStore ?? {}) as Record<string, string>;
  const tabs = (config?.tabs ?? []) as unknown[];

  const hasCompletedPreviewBuild =
    builds?.some(
      (b: Record<string, unknown>) =>
        b.profile === "preview" && b.status === "completed"
    ) ?? false;

  const onboardingSteps = [
    {
      label: "Customize your brand",
      done:
        !!brand.primaryColor &&
        brand.primaryColor !== "#2563EB" &&
        brand.primaryColor !== "#FF9900",
      href: `/tenants/${id}/config`,
    },
    {
      label: "Set app store details",
      done:
        !!appStore.appName &&
        appStore.appName !== "My App",
      href: `/tenants/${id}/config`,
    },
    {
      label: "Upload your logo and assets",
      done:
        !!brand.logoUri && !brand.logoUri.includes("example.com"),
      href: `/tenants/${id}/assets`,
    },
    {
      label: "Configure your pages",
      done: tabs.length > 1,
      href: `/tenants/${id}/config`,
    },
    {
      label: "Create a preview build",
      done: hasCompletedPreviewBuild,
      href: `/tenants/${id}/builds`,
    },
  ];

  // Fetch activity
  const { data: activity } = await supabase
    .from("activity_log")
    .select("id, action, details, created_at, user_email")
    .eq("tenant_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div>
      {/* Tab Bar (includes breadcrumb) */}
      <TenantTabBar
        tenantId={id}
        tenantName={tenant.business_name || id}
        appType={tenant.app_type}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-gray-900">
            {tenant.business_name || id}
          </h1>
          <StatusBadge status={tenant.status} />
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${templateColors[tenant.template_type] ?? "bg-gray-700 text-gray-500"}`}
          >
            {tenant.template_type}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {tenant.status === "draft" && "Configure your app, then create a preview build"}
          {tenant.status === "preview" && "Share with your client for approval before going live"}
          {tenant.status === "production" && "App is built and ready for store submission"}
        </p>
        <div>
          {tenant.status === "draft" && (
            <DeployPreviewButton tenantId={id} />
          )}
          {tenant.status === "preview" && (
            <SharePreviewLink tenantId={id} />
          )}
          {tenant.status === "production" && (
            <Link
              href={`/tenants/${id}/builds`}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-medium text-white transition-colors"
            >
              Go Live
            </Link>
          )}
        </div>
      </div>

      {/* Guidance Card */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 mb-8">
        {tenant.status === "draft" && (
          <div>
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Get started
            </h2>
            <p className="text-base text-blue-800 leading-relaxed mb-4">
              {isCustom ? (
                <>
                  This custom app hasn&apos;t been built yet. Make sure the repo
                  has <strong>eas.json</strong> and{" "}
                  <strong>app.config.ts</strong>, then create a preview build.
                </>
              ) : (
                <>
                  Start by customizing your app&apos;s design -- colors, logo,
                  and layout -- then create a preview build to share with your
                  client.
                </>
              )}
            </p>
            {!isCustom && (
              <ol className="space-y-2 mb-5">
                {onboardingSteps.map((step, i) => (
                  <li key={step.label} className="flex items-center gap-2.5">
                    {step.done ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs flex-shrink-0">
                        ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-200 text-blue-800 text-xs font-medium flex-shrink-0">
                        {i + 1}
                      </span>
                    )}
                    <Link
                      href={step.href}
                      className={`text-sm hover:underline ${
                        step.done
                          ? "text-blue-700/60 line-through"
                          : "text-blue-900 font-medium"
                      }`}
                    >
                      {step.label}
                    </Link>
                  </li>
                ))}
              </ol>
            )}
            {!isCustom ? (
              <Link
                href={`/tenants/${id}/config`}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors"
              >
                Open Design &rarr;
              </Link>
            ) : repoUrl ? (
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors"
              >
                View Repo &rarr;
              </a>
            ) : null}
          </div>
        )}
        {tenant.status === "preview" && (
          <div>
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              Preview ready
            </h2>
            <p className="text-base text-blue-800 leading-relaxed mb-4">
              Share the preview with your client for approval. Once they&apos;re
              happy, head to Builds and go live.
            </p>
            <SharePreviewLink tenantId={id} />
          </div>
        )}
        {tenant.status === "production" && (
          <div>
            <h2 className="text-lg font-semibold text-emerald-900 mb-2">
              Your app is live!
            </h2>
            <p className="text-base text-emerald-800 leading-relaxed">
              {isCustom ? (
                <>
                  Push code changes to the repo, then trigger a new build from
                  Builds when ready.
                </>
              ) : (
                <>
                  Any config changes will need a new build to take effect. Use
                  Design to make updates, then trigger a new build.
                </>
              )}
            </p>
          </div>
        )}
        {tenant.status !== "draft" &&
          tenant.status !== "preview" &&
          tenant.status !== "production" && (
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-2">
                Next steps
              </h2>
              <p className="text-base text-blue-800 leading-relaxed">
                Use the tabs above to configure and build this app.
              </p>
            </div>
          )}
      </div>

      {/* Two-column: Checklist + Latest Build */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left: Go-Live Checklist */}
        <div>
          <ReadinessChecklist tenantId={id} />
        </div>

        {/* Right: Latest Build */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Latest Build
          </h2>
          <div className="rounded-xl bg-white border border-gray-200 p-6">
            {latestBuild ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
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
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      latestBuild.profile === "production"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {latestBuild.profile}
                  </span>

                  {/* Platform */}
                  <span className="text-sm text-gray-500">
                    {latestBuild.platform ?? "android"}
                  </span>

                  {/* Date */}
                  <span className="text-sm text-gray-500">
                    {new Date(latestBuild.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Artifacts */}
                <div className="flex flex-wrap items-center gap-3">
                  {latestBuild.status === "completed" &&
                  latestBuild.download_url ? (
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
        </div>
      </div>

      {/* Custom App: Repository Info */}
      {isCustom && repoUrl && (
        <div className="rounded-xl bg-white border border-gray-200 p-6 mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Repository
          </h2>
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
              <span className="text-sm text-gray-900 font-mono">
                {repoBranch}
              </span>
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

      {/* Recent Activity (collapsed by default) */}
      <details className="rounded-xl bg-white border border-gray-200 mb-8">
        <summary className="px-6 py-4 cursor-pointer select-none flex items-center justify-between text-base font-semibold text-gray-900 hover:bg-gray-50 transition-colors rounded-xl">
          Recent Activity
          <span className="text-sm font-normal text-gray-500">
            Show activity
          </span>
        </summary>
        <div className="px-6 pb-4">
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
      </details>
    </div>
  );
}
