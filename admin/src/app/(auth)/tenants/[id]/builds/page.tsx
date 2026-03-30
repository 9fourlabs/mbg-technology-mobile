import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getExpoBuildPageUrl } from "@/lib/eas";
import DeployButtons from "./deploy-buttons";
import BuildStatusPoller from "./build-status-poller";
import BuildArtifacts from "./build-artifacts";

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
  const expoBuildsUrl = getExpoBuildPageUrl();

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
        <div className="flex items-center gap-3">
          <a
            href={expoBuildsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View All Builds on Expo &rarr;
          </a>
          <DeployButtons tenantId={id} hasExpoProject={hasExpoProject} />
        </div>
      </div>

      {/* Build types explainer */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-5 mb-6">
        <h3 className="text-sm font-semibold text-white mb-3">
          Understanding Build Types
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-400">
                Preview
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Creates a test version of the app that can be installed directly on
              Android phones. Use this to demo the app to your client before going
              live. Share the install link or scan the QR code.
            </p>
          </div>
          <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-400">
                Production
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Submits the app to the App Store (iOS) and Google Play (Android).
              This is the final step — only do this after your client has approved
              the preview.
            </p>
          </div>
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
                <th className="px-6 py-3 font-medium">Artifacts</th>
                <th className="px-6 py-3 font-medium">Platform</th>
                <th className="px-6 py-3 font-medium">Started</th>
                <th className="px-6 py-3 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {builds.map((build) => (
                <tr key={build.id} className="text-sm">
                  <td className="px-6 py-3 font-mono text-xs">
                    {build.build_url ? (
                      <a
                        href={build.build_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        {build.id.slice(0, 8)}
                      </a>
                    ) : (
                      <span className="text-white">{build.id.slice(0, 8)}</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-300">{build.profile}</td>
                  <td className="px-6 py-3">
                    <BuildStatusPoller
                      build={{
                        id: build.id,
                        status: build.status,
                        workflow_run_id: build.workflow_run_id,
                      }}
                      tenantId={id}
                    />
                  </td>
                  <td className="px-6 py-3">
                    {build.status === "completed" && build.download_url ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={build.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:text-blue-400 transition-colors"
                        >
                          Download APK
                        </a>
                        <BuildArtifacts
                          downloadUrl={build.download_url}
                          buildId={build.id}
                        />
                        {build.build_url && (
                          <a
                            href={build.build_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                          >
                            Build Log
                          </a>
                        )}
                      </div>
                    ) : build.status === "completed" ? (
                      <div className="flex items-center gap-2">
                        <BuildStatusPoller
                          build={{
                            id: build.id,
                            status: build.status,
                            workflow_run_id: build.workflow_run_id,
                          }}
                          tenantId={id}
                          artifactsOnly
                        />
                        {build.build_url && (
                          <a
                            href={build.build_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                          >
                            Build Log
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-600">---</span>
                    )}
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
