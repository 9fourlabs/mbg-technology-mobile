"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeployButtons({
  tenantId,
  hasExpoProject,
  missingRequirements = [],
  previewDirty = false,
  productionDirty = false,
}: {
  tenantId: string;
  hasExpoProject: boolean;
  missingRequirements?: string[];
  previewDirty?: boolean;
  productionDirty?: boolean;
}) {
  const productionReady = hasExpoProject && missingRequirements.length === 0;
  const router = useRouter();
  const [loading, setLoading] = useState<"preview" | "production" | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [banner, setBanner] = useState<{
    type: "success" | "error";
    message: string;
    details?: string[];
  } | null>(null);

  async function triggerBuild(profile: "preview" | "production") {
    setLoading(profile);
    setBanner(null);
    setShowConfirm(false);

    try {
      const res = await fetch(`/api/tenants/${tenantId}/trigger-build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBanner({
          type: "error",
          message: data.error ?? "Unknown error",
          details: data.details,
        });
        return;
      }

      setBanner({
        type: "success",
        message:
          profile === "preview"
            ? "Preview build started! This typically takes 10-15 minutes. Check status below."
            : "Production build started! This typically takes 15-30 minutes. Check status below.",
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
          <p>{banner.message}</p>
          {banner.details && banner.details.length > 0 && (
            <ul className="mt-2 space-y-1">
              {banner.details.map((d) => (
                <li key={d} className="text-xs flex items-center gap-1.5">
                  <span>•</span> {d}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <button
            onClick={() => triggerBuild("preview")}
            disabled={loading !== null}
            className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-yellow-600 text-white hover:bg-yellow-700 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading === "preview"
              ? "Building..."
              : previewDirty
              ? "Push Changes to Preview"
              : "Create Preview"}
            {previewDirty && loading !== "preview" && (
              <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
            )}
          </button>
          <div className="relative group">
            <button
              onClick={() => setShowConfirm(true)}
              disabled={loading !== null || !productionReady}
              className={`py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg text-white transition-colors ${
                productionReady
                  ? "bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  : "bg-green-600/40 cursor-not-allowed"
              }`}
            >
              {loading === "production"
                ? "Going live..."
                : productionDirty
                ? "Push Changes Live"
                : "Go Live"}
              {productionDirty && productionReady && loading !== "production" && (
                <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
              )}
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
        <p className="text-xs text-gray-400">
          Preview builds typically take 10-15 minutes. Production builds take 15-30 minutes.
        </p>
      </div>

      {/* ── Go Live Confirmation Modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-80 overflow-x-hidden overflow-y-auto bg-gray-900/60 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowConfirm(false)}>
          <div className="bg-white border border-gray-200 shadow-xl rounded-xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Deploy to Production</h3>
              <p className="text-sm text-gray-600 mb-4">
                This will create a production build for app store submission. Make sure your client has approved the preview version first.
              </p>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4">
                <p className="text-xs text-amber-700">
                  After the build completes, you&apos;ll still need to manually submit to the Apple App Store and Google Play Store.
                </p>
              </div>
            </div>
            <div className="flex justify-end items-center gap-x-2 py-3 px-5 border-t border-gray-200">
              <button
                onClick={() => setShowConfirm(false)}
                className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-2xs hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => triggerBuild("production")}
                className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-green-600 text-white hover:bg-green-700"
              >
                Confirm Deploy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
