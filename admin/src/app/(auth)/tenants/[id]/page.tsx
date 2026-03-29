import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  const tabs = (config?.tabs ?? []) as unknown[];

  // Fetch recent builds
  const { data: builds } = await supabase
    .from("builds")
    .select("id, profile, status, created_at")
    .eq("tenant_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

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
        <span className="text-white">{id}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
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
        <div className="flex gap-3">
          <Link
            href={`/tenants/${id}/config`}
            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
          >
            Edit Config
          </Link>
          <Link
            href={`/tenants/${id}/builds`}
            className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-sm font-medium text-white transition-colors"
          >
            Trigger Build
          </Link>
        </div>
      </div>

      {/* Brand Preview + Config Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Brand Preview */}
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
          <h2 className="text-base font-semibold text-white mb-4">Brand</h2>
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
          <h2 className="text-base font-semibold text-white mb-4">
            Config Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-sm text-gray-400">Tabs</span>
              <span className="text-sm text-white">{tabs.length} configured</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-sm text-gray-400">Template</span>
              <span className="text-sm text-white capitalize">
                {tenant.template_type}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-sm text-gray-400">Status</span>
              <span className="text-sm text-white capitalize">
                {tenant.status}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-400">Created</span>
              <span className="text-sm text-white">
                {new Date(tenant.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 space-y-2">
            <Link
              href={`/tenants/${id}/content`}
              className="block w-full text-center px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
            >
              Manage Content
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Builds */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">Recent Builds</h2>
          <Link
            href={`/tenants/${id}/builds`}
            className="text-sm text-[#2563EB] hover:underline"
          >
            View all
          </Link>
        </div>
        {builds && builds.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                <th className="px-6 py-3 font-medium">Profile</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {builds.map((build) => (
                <tr key={build.id} className="text-sm">
                  <td className="px-6 py-3 text-white">{build.profile}</td>
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
            No builds yet for this tenant.
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div className="rounded-xl bg-gray-900 border border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">Activity Log</h2>
        </div>
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
              No activity recorded for this tenant.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
