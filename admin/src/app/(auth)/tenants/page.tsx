import { createClient } from "@/lib/supabase/server";
import TenantCard from "@/components/TenantCard";
import Link from "next/link";
import TenantFilters from "@/components/TenantFilters";
import InfoTooltip from "@/components/InfoTooltip";

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; template?: string; status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Fetch all tenants for stats (unfiltered)
  const { data: allTenants } = await supabase
    .from("tenants")
    .select("id, status");

  const totalCount = allTenants?.length ?? 0;
  const draftCount = allTenants?.filter((t) => t.status === "draft").length ?? 0;
  const previewCount = allTenants?.filter((t) => t.status === "preview").length ?? 0;
  const liveCount = allTenants?.filter((t) => t.status === "production").length ?? 0;

  // Fetch filtered tenants for the list
  let query = supabase
    .from("tenants")
    .select("id, template_type, status, business_name, updated_at, app_type")
    .order("updated_at", { ascending: false });

  if (params.q) {
    query = query.or(
      `id.ilike.%${params.q}%,business_name.ilike.%${params.q}%`
    );
  }

  if (params.template) {
    query = query.eq("template_type", params.template);
  }

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data: tenants } = await query;

  const activeStatus = params.status ?? null;

  const statCards = [
    { key: "all", label: "Total Apps", count: totalCount, borderColor: "border-l-gray-500", statusFilter: "" },
    { key: "draft", label: "Draft", count: draftCount, borderColor: "border-l-yellow-500", statusFilter: "draft" },
    { key: "preview", label: "In Preview", count: previewCount, borderColor: "border-l-blue-500", statusFilter: "preview" },
    { key: "production", label: "Live", count: liveCount, borderColor: "border-l-green-500", statusFilter: "production" },
  ];

  function buildStatUrl(statusFilter: string) {
    const p = new URLSearchParams();
    if (params.q) p.set("q", params.q);
    if (params.template) p.set("template", params.template);
    if (statusFilter) p.set("status", statusFilter);
    const qs = p.toString();
    return `/tenants${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Apps</h1>
        <p className="text-sm text-gray-500 mt-1 inline-flex items-center gap-2">
          Create and manage mobile apps for your clients.
          <InfoTooltip
            side="right"
            text="Draft = config in progress, no build yet. In Preview = internal build ready for you and your client to test. Live = published to the App Store or Play Store. Click a status card below to filter."
          />
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => {
          const isActive = activeStatus === stat.statusFilter || (!activeStatus && stat.key === "all");
          return (
            <Link
              key={stat.key}
              href={buildStatUrl(stat.statusFilter)}
              className={`rounded-lg bg-white border border-gray-200 border-l-4 ${stat.borderColor} px-4 py-3 transition-colors ${
                isActive ? "ring-1 ring-gray-300" : "hover:border-gray-300"
              }`}
            >
              <p className="text-2xl font-semibold text-gray-900">{stat.count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <Link
          href="/tenants/new"
          className="inline-flex items-center px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors shrink-0"
        >
          + Create New App
        </Link>
        <TenantFilters
          currentQuery={params.q}
          currentTemplate={params.template}
        />
      </div>

      {/* Client App Cards */}
      {tenants && tenants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => (
            <TenantCard
              key={tenant.id}
              id={tenant.id}
              template_type={tenant.template_type}
              status={tenant.status}
              business_name={tenant.business_name}
              updated_at={tenant.updated_at}
              app_type={tenant.app_type}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
          {totalCount === 0 ? (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Welcome to MBG App Platform
              </h2>
              <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                Create branded mobile apps for your clients in minutes. Follow
                these three steps to get started.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left max-w-2xl mx-auto">
                <div className="rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-xs mb-3">
                    1
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Create</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Pick a template and add your client&apos;s branding, colors,
                    and content.
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 font-bold text-xs mb-3">
                    2
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Preview</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Deploy a preview build and share the install link or QR code
                    with your client.
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 font-bold text-xs mb-3">
                    3
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Go Live</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    After approval, deploy to production and submit to app
                    stores.
                  </p>
                </div>
              </div>
              <Link
                href="/tenants/new"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors"
              >
                Create Your First App
              </Link>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-4">No apps match your filters.</p>
              <Link
                href="/tenants"
                className="text-sm text-blue-600 hover:underline font-medium"
              >
                Clear filters
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
