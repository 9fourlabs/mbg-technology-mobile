"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeployPreviewButton({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleDeploy() {
    setLoading(true);
    setBanner(null);

    try {
      const res = await fetch(`/api/tenants/${tenantId}/trigger-build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: "preview" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBanner({ type: "error", message: data.error ?? "Unknown error" });
        return;
      }

      setBanner({
        type: "success",
        message: "Preview build triggered! Check the Latest Build section below.",
      });
      router.refresh();
    } catch (err) {
      setBanner({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to trigger build.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleDeploy}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-sm font-medium text-white transition-colors"
      >
        {loading ? (
          <>
            <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Deploying...
          </>
        ) : (
          "Deploy Preview"
        )}
      </button>
      {banner && (
        <div
          className={`mt-2 rounded-lg px-3 py-2 text-xs ${
            banner.type === "success"
              ? "bg-green-900/20 border border-green-800/50 text-green-400"
              : "bg-red-900/20 border border-red-800/50 text-red-400"
          }`}
        >
          {banner.message}
        </div>
      )}
    </div>
  );
}
