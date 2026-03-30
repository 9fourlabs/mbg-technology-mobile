import { createClient } from "@/lib/supabase/server";
import {
  getCostBreakdown,
  getExpoBudgetUsage,
  getTotalMonthlyCost,
  formatCurrency,
  formatCurrencyPrecise,
} from "@/lib/costs";
import type { ExpoPlan } from "@/lib/costs";
import PricingSimulator from "./pricing-simulator";

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

const statusColors: Record<string, string> = {
  draft: "bg-gray-700 text-gray-300",
  preview: "bg-yellow-900/50 text-yellow-400",
  production: "bg-green-900/50 text-green-400",
};

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, business_name, template_type, status, supabase_project_id, created_at");

  const { data: builds } = await supabase
    .from("builds")
    .select("id, tenant_id, status, profile, created_at");

  const allTenants = tenants ?? [];
  const allBuilds = builds ?? [];

  // Tenants by status
  const tenantsByStatus = {
    draft: allTenants.filter((t) => t.status === "draft").length,
    preview: allTenants.filter((t) => t.status === "preview").length,
    production: allTenants.filter((t) => t.status === "production").length,
  };

  // Builds this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const buildsThisMonth = allBuilds.filter(
    (b) => new Date(b.created_at) >= monthStart
  );

  // Build success rate
  const completedBuilds = allBuilds.filter((b) => b.status === "completed").length;
  const failedBuilds = allBuilds.filter((b) => b.status === "failed").length;
  const buildSuccessRate =
    completedBuilds + failedBuilds > 0
      ? Math.round((completedBuilds / (completedBuilds + failedBuilds)) * 100)
      : 0;

  // Monthly trend (last 6 months)
  const monthlyTrend: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", { month: "short" });
    const count = allBuilds.filter((b) => {
      const bd = new Date(b.created_at);
      return (
        bd.getFullYear() === d.getFullYear() && bd.getMonth() === d.getMonth()
      );
    }).length;
    monthlyTrend.push({ label, count });
  }
  const maxCount = Math.max(...monthlyTrend.map((m) => m.count), 1);

  // Supabase pro count & active tenants
  const supabaseProCount = allTenants.filter(
    (t) => t.supabase_project_id != null
  ).length;
  const activeTenants = allTenants.filter((t) => t.status !== "draft").length;

  // Cost calculations
  const expoPlan: ExpoPlan = "free";
  const costBreakdown = getCostBreakdown(expoPlan, supabaseProCount, activeTenants);
  const budget = getExpoBudgetUsage(buildsThisMonth.length, expoPlan);
  const totalMonthlyCost = getTotalMonthlyCost(expoPlan, supabaseProCount);

  // Per-tenant data
  const perTenantData = allTenants
    .map((tenant) => {
      const tenantBuilds = buildsThisMonth.filter(
        (b) => b.tenant_id === tenant.id
      );
      const allTenantBuilds = allBuilds.filter(
        (b) => b.tenant_id === tenant.id
      );
      const lastBuild =
        allTenantBuilds.length > 0
          ? allTenantBuilds.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )[0]
          : null;
      return {
        ...tenant,
        buildsThisMonth: tenantBuilds.length,
        estCost:
          activeTenants > 0 ? costBreakdown.total / activeTenants : 0,
        lastBuildDate: lastBuild ? lastBuild.created_at : null,
      };
    })
    .sort((a, b) => {
      const order: Record<string, number> = {
        production: 0,
        preview: 1,
        draft: 2,
      };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });

  // Budget bar color
  const budgetColor =
    budget.percent >= 90
      ? "bg-red-500"
      : budget.percent >= 70
        ? "bg-yellow-500"
        : "bg-[#2563EB]";

  return (
    <div>
      {/* A. Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <p className="text-sm text-gray-400 mt-1">
          Platform metrics, cost tracking, and pricing analysis
        </p>
      </div>

      {/* B. Platform Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg bg-gray-900 border border-gray-800 border-l-4 border-l-[#2563EB] px-4 py-3">
          <p className="text-xs text-gray-400">Total Tenants</p>
          <p className="text-2xl font-semibold text-white mt-1">
            {allTenants.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {tenantsByStatus.production} prod &middot; {tenantsByStatus.preview}{" "}
            preview &middot; {tenantsByStatus.draft} draft
          </p>
        </div>
        <div className="rounded-lg bg-gray-900 border border-gray-800 border-l-4 border-l-green-500 px-4 py-3">
          <p className="text-xs text-gray-400">Builds This Month</p>
          <p className="text-2xl font-semibold text-white mt-1">
            {buildsThisMonth.length}
          </p>
        </div>
        <div className="rounded-lg bg-gray-900 border border-gray-800 border-l-4 border-l-yellow-500 px-4 py-3">
          <p className="text-xs text-gray-400">Success Rate</p>
          <p className="text-2xl font-semibold text-white mt-1">
            {buildSuccessRate}%
          </p>
        </div>
        <div className="rounded-lg bg-gray-900 border border-gray-800 border-l-4 border-l-purple-500 px-4 py-3">
          <p className="text-xs text-gray-400">Cost per Tenant</p>
          <p className="text-2xl font-semibold text-white mt-1">
            {formatCurrencyPrecise(costBreakdown.perTenant)}
          </p>
          <p className="text-xs text-gray-500 mt-1">/month</p>
        </div>
      </div>

      {/* C. Monthly Build Trend */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-6 mb-8">
        <h2 className="text-base font-semibold text-white mb-4">
          Build Trend (6 months)
        </h2>
        <div className="flex items-end gap-2 h-32">
          {monthlyTrend.map((m) => (
            <div
              key={m.label}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div
                className="w-full bg-[#2563EB] rounded-t"
                style={{
                  height: `${(m.count / maxCount) * 100}%`,
                  minHeight: m.count > 0 ? "4px" : "0",
                }}
              />
              <span className="text-xs text-gray-500">{m.label}</span>
              <span className="text-xs text-gray-400">{m.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* D. Cost Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Fixed Costs */}
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
          <h2 className="text-base font-semibold text-white mb-4">
            Fixed Costs
          </h2>
          <table className="w-full text-sm">
            <tbody>
              {costBreakdown.fixed.map((item) => (
                <tr key={item.label}>
                  <td className="py-1.5 text-gray-400">{item.label}</td>
                  <td className="py-1.5 text-right text-gray-300">
                    {formatCurrencyPrecise(item.amount)}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-gray-800">
                <td className="pt-2 text-gray-300 font-medium">Subtotal</td>
                <td className="pt-2 text-right text-white font-medium">
                  {formatCurrencyPrecise(
                    costBreakdown.fixed.reduce((s, i) => s + i.amount, 0)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Variable Costs */}
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
          <h2 className="text-base font-semibold text-white mb-4">
            Variable Costs
          </h2>
          <table className="w-full text-sm">
            <tbody>
              {costBreakdown.variable.length > 0 ? (
                costBreakdown.variable.map((item) => (
                  <tr key={item.label}>
                    <td className="py-1.5 text-gray-400">{item.label}</td>
                    <td className="py-1.5 text-right text-gray-300">
                      {formatCurrencyPrecise(item.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-1.5 text-gray-500" colSpan={2}>
                    No variable costs yet
                  </td>
                </tr>
              )}
              <tr className="border-t border-gray-800">
                <td className="pt-2 text-gray-300 font-medium">Subtotal</td>
                <td className="pt-2 text-right text-white font-medium">
                  {formatCurrencyPrecise(
                    costBreakdown.variable.reduce((s, i) => s + i.amount, 0)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 font-medium">
                Total Monthly Cost
              </span>
              <span className="text-xl font-semibold text-white">
                {formatCurrency(costBreakdown.total)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrencyPrecise(costBreakdown.perTenant)} per tenant
            </p>
          </div>
        </div>
      </div>

      {/* E. Expo Build Budget */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-6 mb-8">
        <h2 className="text-base font-semibold text-white mb-4">
          Expo Build Budget
        </h2>
        <div className="w-full bg-gray-800 rounded-full h-3">
          <div
            className={`${budgetColor} rounded-full h-3`}
            style={{ width: `${budget.percent}%` }}
          />
        </div>
        <p className="text-sm text-gray-400 mt-2">
          {budget.used} / {budget.limit} builds used ({budget.percent}%)
        </p>
      </div>

      {/* F. Pricing Simulator */}
      <div className="mb-8">
        <PricingSimulator
          currentTenantCount={activeTenants}
          currentMonthlyCost={totalMonthlyCost}
          supabaseProCount={supabaseProCount}
          expoPlan={expoPlan}
        />
      </div>

      {/* G. Per-Tenant Metrics */}
      <div className="rounded-xl bg-gray-900 border border-gray-800">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">
            Per-Tenant Metrics
          </h2>
        </div>
        <div className="overflow-x-auto">
          {perTenantData.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Template</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Builds</th>
                  <th className="px-6 py-3 font-medium">Est. Cost</th>
                  <th className="px-6 py-3 font-medium">Last Build</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {perTenantData.map((tenant) => (
                  <tr key={tenant.id} className="text-sm">
                    <td className="px-6 py-3 text-white font-medium">
                      {tenant.business_name || tenant.id}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          templateColors[tenant.template_type] ??
                          "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {tenant.template_type}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[tenant.status] ??
                          "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400">
                      {tenant.buildsThisMonth}
                    </td>
                    <td className="px-6 py-3 text-gray-400">
                      {tenant.status !== "draft"
                        ? formatCurrencyPrecise(tenant.estCost)
                        : "-"}
                    </td>
                    <td className="px-6 py-3 text-gray-500">
                      {tenant.lastBuildDate
                        ? new Date(tenant.lastBuildDate).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-8 text-center text-sm text-gray-500">
              No tenants yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
