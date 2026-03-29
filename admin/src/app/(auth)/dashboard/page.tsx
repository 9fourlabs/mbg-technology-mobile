import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function StatusBadge({
  status,
}: {
  status: string;
}) {
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
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] ?? "bg-gray-700 text-gray-300"}`}
    >
      {status}
    </span>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch tenant counts
  const { data: tenants } = await supabase.from("tenants").select("id, status");
  const totalTenants = tenants?.length ?? 0;
  const productionCount =
    tenants?.filter((t) => t.status === "production").length ?? 0;
  const draftCount = tenants?.filter((t) => t.status === "draft").length ?? 0;
  const previewCount =
    tenants?.filter((t) => t.status === "preview").length ?? 0;

  // Fetch recent builds
  const { data: builds } = await supabase
    .from("builds")
    .select("id, tenant_id, profile, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch recent activity
  const { data: activity } = await supabase
    .from("activity_log")
    .select("id, action, tenant_id, details, created_at, user_email")
    .order("created_at", { ascending: false })
    .limit(10);

  const stats = [
    {
      label: "Total Tenants",
      value: totalTenants,
      detail: `${draftCount} draft, ${previewCount} preview`,
    },
    {
      label: "Active Builds",
      value: builds?.filter((b) => b.status === "building").length ?? 0,
      detail: `${builds?.filter((b) => b.status === "completed").length ?? 0} completed today`,
    },
    {
      label: "Production Apps",
      value: productionCount,
      detail: `${totalTenants - productionCount} in development`,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            Overview of your mobile platform
          </p>
        </div>
        <Link
          href="/tenants/new"
          className="inline-flex items-center px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-sm font-medium text-white transition-colors"
        >
          + New Tenant
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-gray-900 border border-gray-800 p-6"
          >
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className="text-3xl font-semibold text-white mt-1">
              {stat.value}
            </p>
            <p className="text-xs text-gray-500 mt-2">{stat.detail}</p>
          </div>
        ))}
      </div>

      {/* Recent Builds */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 mb-8">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">Recent Builds</h2>
        </div>
        <div className="overflow-x-auto">
          {builds && builds.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                  <th className="px-6 py-3 font-medium">Tenant</th>
                  <th className="px-6 py-3 font-medium">Profile</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {builds.map((build) => (
                  <tr key={build.id} className="text-sm">
                    <td className="px-6 py-3 text-white font-medium">
                      <Link
                        href={`/tenants/${build.tenant_id}`}
                        className="hover:text-[#2563EB] transition-colors"
                      >
                        {build.tenant_id}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-gray-400">{build.profile}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={build.status} />
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {new Date(build.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-8 text-center text-sm text-gray-500">
              No builds yet. Create a tenant and trigger your first build.
            </div>
          )}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="rounded-xl bg-gray-900 border border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">
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
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-[#2563EB] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300">
                      <span className="font-medium text-white">
                        {entry.action}
                      </span>
                      {entry.tenant_id && (
                        <>
                          {" "}
                          on{" "}
                          <Link
                            href={`/tenants/${entry.tenant_id}`}
                            className="text-[#2563EB] hover:underline"
                          >
                            {entry.tenant_id}
                          </Link>
                        </>
                      )}
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
    </div>
  );
}
