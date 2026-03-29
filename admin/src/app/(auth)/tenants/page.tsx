import { createClient } from "@/lib/supabase/server";
import TenantCard from "@/components/TenantCard";
import Link from "next/link";
import TenantFilters from "@/components/TenantFilters";

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; template?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("tenants")
    .select("id, template_type, status, business_name, updated_at")
    .order("updated_at", { ascending: false });

  if (params.q) {
    query = query.or(
      `id.ilike.%${params.q}%,business_name.ilike.%${params.q}%`
    );
  }

  if (params.template) {
    query = query.eq("template_type", params.template);
  }

  const { data: tenants } = await query;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tenants</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your tenant configurations
          </p>
        </div>
        <Link
          href="/tenants/new"
          className="inline-flex items-center px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-sm font-medium text-white transition-colors"
        >
          + New Tenant
        </Link>
      </div>

      {/* Filters */}
      <TenantFilters
        currentQuery={params.q}
        currentTemplate={params.template}
      />

      {/* Tenant Grid */}
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
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-12 text-center">
          <p className="text-gray-400 mb-4">No tenants found.</p>
          <Link
            href="/tenants/new"
            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-sm font-medium text-white transition-colors"
          >
            Create your first tenant
          </Link>
        </div>
      )}
    </div>
  );
}
