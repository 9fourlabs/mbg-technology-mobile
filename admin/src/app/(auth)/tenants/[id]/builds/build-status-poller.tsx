"use client";

import { useEffect, useState } from "react";
import QRCode from "@/components/QRCode";

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
  artifactsOnly = false,
}: {
  build: Build;
  tenantId: string;
  artifactsOnly?: boolean;
}) {
  const [status, setStatus] = useState(build.status);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    // For artifactsOnly mode on completed builds, keep polling until we get a download URL
    const isTerminal = TERMINAL_STATUSES.has(status);
    if (isTerminal && !artifactsOnly) return;
    if (isTerminal && downloadUrl) return;

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
        if (active && data.download_url) {
          setDownloadUrl(data.download_url);
        }
      } catch {
        // Silently ignore polling errors
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [status, downloadUrl, build.id, tenantId, artifactsOnly]);

  // Artifacts-only mode: renders in the Artifacts column for completed builds without a URL yet
  if (artifactsOnly) {
    if (downloadUrl) {
      return (
        <div className="flex items-center gap-2">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] hover:text-blue-400 transition-colors"
          >
            Download APK
          </a>
          <button
            onClick={() => setShowQR(!showQR)}
            className="text-xs text-gray-400 hover:text-white transition-colors"
            title="Show QR code"
          >
            QR
          </button>
          {showQR && (
            <div className="absolute z-40 mt-2 p-3 bg-white rounded-lg shadow-xl">
              <QRCode url={downloadUrl} size={150} />
            </div>
          )}
        </div>
      );
    }
    return (
      <span className="text-xs text-gray-500 animate-pulse">
        Processing...
      </span>
    );
  }

  // Normal status mode: renders in the Status column
  return (
    <span className="inline-flex items-center gap-2">
      <StatusDot status={status} />
      {status === "completed" && downloadUrl && (
        <span className="inline-flex items-center gap-1.5">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-[#2563EB] hover:text-blue-400 transition-colors"
          >
            Download
          </a>
          <span className="relative">
            <button
              onClick={() => setShowQR(!showQR)}
              className="text-xs text-gray-400 hover:text-white transition-colors"
              title="Show QR code"
            >
              QR
            </button>
            {showQR && (
              <div className="absolute z-40 right-0 top-6 p-3 bg-white rounded-lg shadow-xl">
                <QRCode url={downloadUrl} size={150} />
              </div>
            )}
          </span>
        </span>
      )}
    </span>
  );
}
