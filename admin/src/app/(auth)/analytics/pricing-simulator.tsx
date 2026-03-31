"use client";

import { useState } from "react";
import {
  getBreakEvenTenants,
  getPricingGrid,
  getTotalMonthlyCost,
  formatCurrency,
} from "@/lib/costs";
import type { ExpoPlan } from "@/lib/costs";

export default function PricingSimulator({
  currentTenantCount,
  currentMonthlyCost,
  supabaseProCount,
  expoPlan,
}: {
  currentTenantCount: number;
  currentMonthlyCost: number;
  supabaseProCount: number;
  expoPlan: ExpoPlan;
}) {
  const [monthlyPrice, setMonthlyPrice] = useState(149);
  const [selectedPlan, setSelectedPlan] = useState<ExpoPlan>(expoPlan);

  const breakEven = getBreakEvenTenants(monthlyPrice, selectedPlan, supabaseProCount);
  const monthlyRevenue = monthlyPrice * currentTenantCount;
  const totalCost = getTotalMonthlyCost(selectedPlan, supabaseProCount);
  const monthlyProfit = monthlyRevenue - totalCost;
  const grid = getPricingGrid(selectedPlan, supabaseProCount);
  const prices = [99, 149, 199, 299];

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Pricing Simulator
      </h2>

      {/* Input row */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Monthly price per tenant
          </label>
          <div className="flex items-center gap-1">
            <span className="text-gray-500 text-sm">$</span>
            <input
              type="number"
              min={0}
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(Number(e.target.value))}
              className="w-24 rounded-lg bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Expo plan</label>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value as ExpoPlan)}
            className="rounded-lg bg-gray-100 border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
          >
            <option value="free">Free</option>
            <option value="pro">Pro ($99/mo)</option>
          </select>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-white border border-gray-200 p-6">
          <p className="text-xs text-gray-500 mb-1">Break-even tenants</p>
          <p className="text-2xl font-semibold text-gray-900">
            {breakEven === Infinity ? "N/A" : breakEven}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 p-6">
          <p className="text-xs text-gray-500 mb-1">
            Monthly revenue ({currentTenantCount} tenants)
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            {formatCurrency(monthlyRevenue)}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 p-6">
          <p className="text-xs text-gray-500 mb-1">Monthly profit</p>
          <p
            className={`text-2xl font-semibold ${
              monthlyProfit >= 0 ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {formatCurrency(monthlyProfit)}
          </p>
        </div>
      </div>

      {/* Pricing grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-200">
              <th className="px-4 py-2 font-medium">Tenants</th>
              {prices.map((p) => (
                <th
                  key={p}
                  className={`px-4 py-2 font-medium text-center ${
                    p === monthlyPrice ? "bg-gray-100" : ""
                  }`}
                >
                  {formatCurrency(p)}/mo
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {grid.map((row) => {
              const isClosestRow =
                row.tenantCount ===
                grid.reduce((closest, r) =>
                  Math.abs(r.tenantCount - currentTenantCount) <
                  Math.abs(closest.tenantCount - currentTenantCount)
                    ? r
                    : closest
                ).tenantCount;

              return (
                <tr key={row.tenantCount}>
                  <td
                    className={`px-4 py-2 text-gray-600 font-medium ${
                      isClosestRow ? "bg-gray-100" : ""
                    }`}
                  >
                    {row.tenantCount}
                  </td>
                  {row.cells.map((cell) => {
                    const isHighlightCol = cell.price === monthlyPrice;
                    const isHighlight = isHighlightCol || isClosestRow;
                    return (
                      <td
                        key={cell.price}
                        className={`px-4 py-2 text-center ${
                          isHighlight ? "bg-gray-100" : ""
                        } ${
                          cell.profit >= 0
                            ? "text-emerald-700"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(cell.profit)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
