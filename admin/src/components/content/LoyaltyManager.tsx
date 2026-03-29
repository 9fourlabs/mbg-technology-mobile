"use client";

import { useState } from "react";
import { DataTable } from "@/components/content/DataTable";
import { getSchemasForTemplate } from "@/lib/content-schemas";

const schemas = getSchemasForTemplate("loyalty");

const tabs = schemas.map((s) => ({ key: s.table, label: s.label }));

export default function LoyaltyManager({ tenantId }: { tenantId: string }) {
  const [activeTab, setActiveTab] = useState(tabs[0].key);

  const activeSchema = schemas.find((s) => s.table === activeTab)!;

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              activeTab === tab.key
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <DataTable tenantId={tenantId} schema={activeSchema} />
    </div>
  );
}
