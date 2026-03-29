"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeployButtons({
  tenantId,
  hasExpoProject,
}: {
  tenantId: string;
  hasExpoProject: boolean;
}) {
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
              ? "bg-green-900/20 border border-green-800/50 text-green-400"
              : "bg-red-900/20 border border-red-800/50 text-red-400"
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
        <button
          onClick={() => triggerBuild("production")}
          disabled={loading !== null || !hasExpoProject}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors ${
            hasExpoProject
              ? "bg-green-600 hover:bg-green-700 disabled:opacity-50"
              : "bg-green-600/40 cursor-not-allowed"
          }`}
        >
          {loading === "production" ? "Deploying..." : "Deploy Production"}
        </button>
      </div>
    </>
  );
}
