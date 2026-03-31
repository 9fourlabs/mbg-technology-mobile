"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeployButtons({
  tenantId,
  hasExpoProject,
  missingRequirements = [],
}: {
  tenantId: string;
  hasExpoProject: boolean;
  missingRequirements?: string[];
}) {
  const productionReady = hasExpoProject && missingRequirements.length === 0;
  const router = useRouter();
  const [loading, setLoading] = useState<"preview" | "production" | null>(null);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function triggerBuild(profile: "preview" | "production") {
    setLoading(profile);
    setBanner(null);

    try {
      const res = await fetch(`/api/tenants/${tenantId}/trigger-build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBanner({ type: "error", message: data.error ?? "Unknown error" });
        return;
      }

      setBanner({
        type: "success",
        message: "Build triggered! Check back shortly for updates.",
      });
      router.refresh();
    } catch (err) {
      setBanner({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to trigger build.",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      {banner && (
        <div
          className={`rounded-lg px-4 py-3 text-sm mb-6 ${
            banner.type === "success"
              ? "bg-emerald-50 border border-green-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-600"
          }`}
        >
          {banner.message}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => triggerBuild("preview")}
          disabled={loading !== null}
          className="px-4 py-2.5 rounded-lg bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-sm font-medium text-white transition-colors"
        >
          {loading === "preview" ? "Deploying..." : "Deploy Preview"}
        </button>
        <div className="relative group">
          <button
            onClick={() => triggerBuild("production")}
            disabled={loading !== null || !productionReady}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors ${
              productionReady
                ? "bg-green-600 hover:bg-green-700 disabled:opacity-50"
                : "bg-green-600/40 cursor-not-allowed"
            }`}
          >
            {loading === "production" ? "Deploying..." : "Deploy Production"}
          </button>
          {!productionReady && missingRequirements.length > 0 && (
            <div className="hidden group-hover:block absolute z-50 bottom-full left-0 mb-2 w-64 p-3 rounded-lg bg-gray-100 border border-gray-300 shadow-md">
              <p className="text-xs font-medium text-gray-900 mb-1.5">
                Not ready for production:
              </p>
              <ul className="space-y-1">
                {missingRequirements.map((req) => (
                  <li key={req} className="text-xs text-red-600 flex items-center gap-1.5">
                    <span className="text-red-500">✗</span> {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
