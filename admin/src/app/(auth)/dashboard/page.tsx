import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BuildStatusPoller from "@/app/(auth)/tenants/[id]/builds/build-status-poller";

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const colors: Record<string, string> = {
    draft: "bg-gray-200 text-gray-600",
    preview: "bg-amber-50 text-amber-700",
    production: "bg-emerald-50 text-emerald-700",
    pending: "bg-blue-50 text-blue-600",
    building: "bg-amber-50 text-amber-700",
    completed: "bg-emerald-50 text-emerald-700",
    failed: "bg-red-50 text-red-600",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? "bg-gray-200 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

export default async function BuildJobsPage() {
  const supabase = await createClient();

  // Fetch recent builds with higher limit
  const { data: builds } = await supabase
    .from("builds")
    .select("id, tenant_id, profile, status, created_at, workflow_run_id, updated_at")
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch recent activity
  const { data: activity } = await supabase
    .from("activity_log")
    .select("id, action, tenant_id, details, created_at, user_email")
    .order("created_at", { ascending: false })
    .limit(10);

  // Compute summary stats for builds
  const buildingCount = builds?.filter((b) => b.status === "building" || b.status === "pending" || b.status === "queued").length ?? 0;
  const completedCount = builds?.filter((b) => b.status === "completed").length ?? 0;
  const failedCount = builds?.filter((b) => b.status === "failed").length ?? 0;

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Recent Builds</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your app builds
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2.5 rounded-lg border border-gray-300 hover:border-gray-600 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Refresh
        </Link>
      </div>

      {/* Build summary chips */}
      <div className="flex items-center gap-4 mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-gray-600">{buildingCount} in progress</span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-gray-600">{completedCount} completed</span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-gray-600">{failedCount} failed</span>
        </div>
      </div>

      {/* Builds Table */}
      <div className="rounded-xl bg-white border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">All Builds</h2>
        </div>
        <div className="overflow-x-auto">
          {builds && builds.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-200">
                  <th className="px-6 py-3 font-medium">Tenant</th>
                  <th className="px-6 py-3 font-medium">Profile</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Artifacts</th>
                  <th className="px-6 py-3 font-medium">Started</th>
                  <th className="px-6 py-3 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {builds.map((build) => (
                  <tr key={build.id} className="text-sm">
                    <td className="px-6 py-3 text-gray-900 font-medium">
                      <Link
                        href={`/tenants/${build.tenant_id}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {build.tenant_id}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{build.profile}</td>
                    <td className="px-6 py-3">
                      <BuildStatusPoller
                        build={{
                          id: build.id,
                          status: build.status,
                          workflow_run_id: build.workflow_run_id,
                        }}
                        tenantId={build.tenant_id}
                      />
                    </td>
                    <td className="px-6 py-3 relative">
                      {build.status === "completed" ? (
                        <BuildStatusPoller
                          build={{
                            id: build.id,
                            status: build.status,
                            workflow_run_id: build.workflow_run_id,
                          }}
                          tenantId={build.tenant_id}
                          artifactsOnly
                        />
                      ) : (
                        <span className="text-xs text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-400">
                      {new Date(build.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-gray-400">
                      {formatDuration(build.created_at, build.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-8 text-center text-sm text-gray-400">
              No builds yet. Create a client app and trigger your first build.
            </div>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="rounded-xl bg-white border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            Recent Activity
          </h2>
        </div>
        <div className="px-6 py-4">
          {activity && activity.length > 0 ? (
            <div className="space-y-4">
              {activity.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-600">
                      <span className="font-medium text-gray-900">
                        {entry.action}
                      </span>
                      {entry.tenant_id && (
                        <>
                          {" "}
                          on{" "}
                          <Link
                            href={`/tenants/${entry.tenant_id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {entry.tenant_id}
                          </Link>
                        </>
                      )}
                    </p>
                    {entry.details && (
                      <p className="text-gray-400 truncate">{entry.details}</p>
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
            <p className="text-sm text-gray-400 text-center py-4">
              No activity recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
