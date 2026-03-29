"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const TEMPLATE_TYPES = [
  "informational",
  "authenticated",
  "booking",
  "commerce",
  "loyalty",
  "content",
  "forms",
  "directory",
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
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <form onSubmit={handleSearch} className="flex-1">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tenants..."
          className="w-full rounded-lg bg-gray-900 border border-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
        />
      </form>
      <select
        value={currentTemplate ?? ""}
        onChange={(e) => updateParams("template", e.target.value)}
        className="rounded-lg bg-gray-900 border border-gray-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
      >
        <option value="">All Templates</option>
        {TEMPLATE_TYPES.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
