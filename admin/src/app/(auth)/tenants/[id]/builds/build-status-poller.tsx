"use client";

import { useEffect, useState } from "react";

interface Build {
  id: string;
  status: string;
  workflow_run_id: string | null;
}

const STATUS_CONFIG: Record<
  string,
  { color: string; label: string; pulse: boolean }
> = {
  pending: { color: "bg-blue-400", label: "Pending", pulse: true },
  queued: { color: "bg-blue-400", label: "Queued", pulse: true },
  building: { color: "bg-yellow-400", label: "Building...", pulse: true },
  completed: { color: "bg-green-400", label: "Completed", pulse: false },
  failed: { color: "bg-red-400", label: "Failed", pulse: false },
  cancelled: { color: "bg-gray-400", label: "Cancelled", pulse: false },
};

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled"]);
const POLL_INTERVAL = 15_000;

function StatusDot({
  status,
}: {
  status: string;
}) {
  const config = STATUS_CONFIG[status] ?? {
    color: "bg-gray-400",
    label: status,
    pulse: false,
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-2.5 w-2.5">
        {config.pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.color} opacity-75`}
          />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${config.color}`}
        />
      </span>
      <span className="text-xs font-medium text-gray-300">{config.label}</span>
    </span>
  );
}

export default function BuildStatusPoller({
  build,
  tenantId,
}: {
  build: Build;
  tenantId: string;
}) {
  const [status, setStatus] = useState(build.status);

  useEffect(() => {
    // Don't poll if already in a terminal state
    if (TERMINAL_STATUSES.has(status)) return;

    let active = true;

    async function poll() {
      try {
        const res = await fetch(
          `/api/tenants/${tenantId}/build-status?build_id=${build.id}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (active && data.status) {
          setStatus(data.status);
        }
      } catch {
        // Silently ignore polling errors
      }
    }

    // Poll immediately on mount, then every 15 seconds
    poll();
    const interval = setInterval(poll, POLL_INTERVAL);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [status, build.id, tenantId]);

  return <StatusDot status={status} />;
}
