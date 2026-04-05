import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TenantTabBar from "@/components/TenantTabBar";
import AnalyticsDashboard from "./analytics-dashboard";

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, business_name, app_type")
    .eq("id", id)
    .single();

  if (!tenant) notFound();

  return (
    <div>
      <TenantTabBar tenantId={id} tenantName={tenant.business_name || id} appType={(tenant as any).app_type} />
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Analytics</h1>
      <AnalyticsDashboard tenantId={id} />
    </div>
  );
}
