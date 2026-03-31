"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RetryBuildButton({
  tenantId,
  profile,
}: {
  tenantId: string;
  profile: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRetry() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/trigger-build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // Silently fail — the user can see the build list
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRetry}
      disabled={loading}
      className="text-xs font-medium text-amber-700 hover:text-amber-600 transition-colors disabled:opacity-50"
    >
      {loading ? "Retrying..." : "Retry"}
    </button>
  );
}
