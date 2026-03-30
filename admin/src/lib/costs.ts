export const COSTS = {
  appleDeveloper: { yearly: 99, monthly: 8.25, label: "Apple Developer Program" },
  googlePlay: { oneTime: 25, monthly: 0, label: "Google Play (one-time)" },
  expoFree: { monthly: 0, buildLimit: 30, label: "Expo Free" },
  expoPro: { monthly: 99, buildLimit: 1000, label: "Expo Production" },
  supabaseFree: { monthly: 0, label: "Supabase Free" },
  supabasePro: { monthly: 25, label: "Supabase Pro (per project)" },
  flyAdmin: { monthly: 7.5, label: "Fly.io Admin Hosting" },
  github: { monthly: 0, label: "GitHub (free tier)" },
} as const;

export type ExpoPlan = "free" | "pro";

export type CostLineItem = { label: string; amount: number };

export type CostBreakdown = {
  fixed: CostLineItem[];
  variable: CostLineItem[];
  total: number;
  perTenant: number;
};

export type PricingCell = { price: number; revenue: number; cost: number; profit: number };
export type PricingRow = { tenantCount: number; cells: PricingCell[] };

export function getFixedMonthlyCosts(expoPlan: ExpoPlan): { items: CostLineItem[]; total: number } {
  const items: CostLineItem[] = [
    { label: COSTS.appleDeveloper.label, amount: COSTS.appleDeveloper.monthly },
    { label: COSTS.flyAdmin.label, amount: COSTS.flyAdmin.monthly },
    { label: expoPlan === "pro" ? COSTS.expoPro.label : COSTS.expoFree.label, amount: expoPlan === "pro" ? COSTS.expoPro.monthly : COSTS.expoFree.monthly },
    { label: COSTS.github.label, amount: COSTS.github.monthly },
  ];
  return { items, total: items.reduce((s, i) => s + i.amount, 0) };
}

export function getVariableMonthlyCosts(supabaseProCount: number): { items: CostLineItem[]; total: number } {
  const items: CostLineItem[] = [];
  if (supabaseProCount > 0) {
    items.push({ label: `Supabase Pro × ${supabaseProCount} projects`, amount: supabaseProCount * COSTS.supabasePro.monthly });
  }
  return { items, total: items.reduce((s, i) => s + i.amount, 0) };
}

export function getTotalMonthlyCost(expoPlan: ExpoPlan, supabaseProCount: number): number {
  return getFixedMonthlyCosts(expoPlan).total + getVariableMonthlyCosts(supabaseProCount).total;
}

export function getCostBreakdown(expoPlan: ExpoPlan, supabaseProCount: number, activeTenants: number): CostBreakdown {
  const fixed = getFixedMonthlyCosts(expoPlan);
  const variable = getVariableMonthlyCosts(supabaseProCount);
  const total = fixed.total + variable.total;
  return {
    fixed: fixed.items,
    variable: variable.items,
    total,
    perTenant: activeTenants > 0 ? total / activeTenants : total,
  };
}

export function getBreakEvenTenants(monthlyPricePerTenant: number, expoPlan: ExpoPlan, supabaseProCount: number): number {
  if (monthlyPricePerTenant <= 0) return Infinity;
  const totalCost = getTotalMonthlyCost(expoPlan, supabaseProCount);
  return Math.ceil(totalCost / monthlyPricePerTenant);
}

export function getExpoBudgetUsage(buildsThisMonth: number, plan: ExpoPlan): { used: number; limit: number; percent: number } {
  const limit = plan === "pro" ? COSTS.expoPro.buildLimit : COSTS.expoFree.buildLimit;
  return { used: buildsThisMonth, limit, percent: Math.min(100, Math.round((buildsThisMonth / limit) * 100)) };
}

export function getPricingGrid(expoPlan: ExpoPlan, supabaseProCount: number): PricingRow[] {
  const tenantCounts = [5, 10, 15, 20, 25];
  const prices = [99, 149, 199, 299];

  return tenantCounts.map(tenantCount => ({
    tenantCount,
    cells: prices.map(price => {
      // Scale supabase cost proportionally if more tenants than current
      const scaledSupabaseCount = Math.max(supabaseProCount, Math.ceil(tenantCount * 0.5)); // assume ~50% of tenants use Supabase
      const cost = getTotalMonthlyCost(expoPlan, scaledSupabaseCount);
      const revenue = price * tenantCount;
      return { price, revenue, cost, profit: revenue - cost };
    }),
  }));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export function formatCurrencyPrecise(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}
