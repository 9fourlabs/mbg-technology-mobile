import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
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

export default async function BuildsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, business_name, expo_project_id, status")
    .eq("id", id)
    .single();

  if (!tenant) {
    notFound();
  }

  const { data: builds } = await supabase
    .from("builds")
    .select("*")
    .eq("tenant_id", id)
    .order("created_at", { ascending: false });

  const hasExpoProject = !!tenant.expo_project_id;

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/tenants" className="hover:text-white transition-colors">
          Tenants
        </Link>
        <span>/</span>
        <Link
          href={`/tenants/${id}`}
          className="hover:text-white transition-colors"
        >
          {id}
        </Link>
        <span>/</span>
        <span className="text-white">Builds</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Builds</h1>
          <p className="text-sm text-gray-400 mt-1">
            {tenant.business_name || id}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/tenants/${id}`}
            className="px-4 py-2.5 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-sm font-medium text-white transition-colors"
          >
            Deploy Preview
          </Link>
          <span
            className={`px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors ${hasExpoProject ? "bg-green-600" : "bg-green-600/40 cursor-not-allowed"}`}
          >
            Deploy Production
          </span>
        </div>
      </div>

      {!hasExpoProject && (
        <div className="rounded-lg bg-yellow-900/20 border border-yellow-800/50 px-4 py-3 text-sm text-yellow-400 mb-6">
          Production deploys require an Expo project ID. Configure one in the
          tenant settings.
        </div>
      )}

      {/* Build History */}
      <div className="rounded-xl bg-gray-900 border border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">Build History</h2>
        </div>
        {builds && builds.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                <th className="px-6 py-3 font-medium">Build ID</th>
                <th className="px-6 py-3 font-medium">Profile</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Platform</th>
                <th className="px-6 py-3 font-medium">Started</th>
                <th className="px-6 py-3 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {builds.map((build) => (
                <tr key={build.id} className="text-sm">
                  <td className="px-6 py-3 text-white font-mono text-xs">
                    {build.id.slice(0, 8)}
                  </td>
                  <td className="px-6 py-3 text-gray-300">{build.profile}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={build.status} />
                  </td>
                  <td className="px-6 py-3 text-gray-400">
                    {build.platform ?? "android"}
                  </td>
                  <td className="px-6 py-3 text-gray-500">
                    {new Date(build.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-gray-500">
                    ---
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No builds yet. Click &ldquo;Deploy Preview&rdquo; to start your
            first build.
          </div>
        )}
      </div>
    </div>
  );
}
