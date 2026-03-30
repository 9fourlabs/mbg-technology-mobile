"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function bumpVersion(
  version: string,
  type: "patch" | "minor" | "major"
): string {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return "1.0.1";

  switch (type) {
    case "major":
      return `${parts[0] + 1}.0.0`;
    case "minor":
      return `${parts[0]}.${parts[1] + 1}.0`;
    case "patch":
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  }
}

export default function VersionBump({
  tenantId,
  currentVersion,
}: {
  tenantId: string;
  currentVersion: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleBump(type: "patch" | "minor" | "major") {
    const newVersion = bumpVersion(currentVersion, type);
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: newVersion }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400">Version</span>
      <span className="text-sm text-white font-mono font-semibold">
        {currentVersion}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleBump("patch")}
          disabled={loading}
          className="px-2 py-0.5 text-xs rounded bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-50"
          title={`Bump to ${bumpVersion(currentVersion, "patch")}`}
        >
          Patch
        </button>
        <button
          onClick={() => handleBump("minor")}
          disabled={loading}
          className="px-2 py-0.5 text-xs rounded bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-50"
          title={`Bump to ${bumpVersion(currentVersion, "minor")}`}
        >
          Minor
        </button>
        <button
          onClick={() => handleBump("major")}
          disabled={loading}
          className="px-2 py-0.5 text-xs rounded bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-colors disabled:opacity-50"
          title={`Bump to ${bumpVersion(currentVersion, "major")}`}
        >
          Major
        </button>
      </div>
    </div>
  );
}
