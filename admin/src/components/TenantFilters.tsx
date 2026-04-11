"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { TEMPLATE_LABELS } from "@/lib/labels";

const TEMPLATE_TYPES = [
  "informational",
  "authenticated",
  "booking",
  "commerce",
  "loyalty",
  "content",
  "forms",
  "directory",
  "custom",
];

export default function TenantFilters({
  currentQuery,
  currentTemplate,
}: {
  currentQuery?: string;
  currentTemplate?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(currentQuery ?? "");

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/tenants?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams("q", query);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 flex-1">
      <form onSubmit={handleSearch} className="flex-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search apps..."
          className="py-2.5 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </form>
      <select
        value={currentTemplate ?? ""}
        onChange={(e) => updateParams("template", e.target.value)}
        className="py-2.5 px-4 pe-9 block border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">All Types</option>
        {TEMPLATE_TYPES.map((t) => (
          <option key={t} value={t}>
            {TEMPLATE_LABELS[t] ?? t}
          </option>
        ))}
      </select>
    </div>
  );
}
