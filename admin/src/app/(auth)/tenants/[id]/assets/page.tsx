import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TenantTabBar from "@/components/TenantTabBar";
import AssetsManager from "./assets-manager";

export default async function AssetsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, business_name, app_type")
    .eq("id", id)
    .single();

  if (!tenant) {
    notFound();
  }

  return (
    <div>
      <TenantTabBar
        tenantId={id}
        tenantName={tenant.business_name || id}
        appType={(tenant as any).app_type}
      />

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Asset Management
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {tenant.business_name || id}
        </p>
      </div>

      <AssetsManager tenantId={id} />
    </div>
  );
}
