"use client";

import { useState } from "react";
import QRCode from "@/components/QRCode";

interface BuildArtifactsProps {
  downloadUrl: string;
  buildId: string;
}

export default function BuildArtifacts({
  downloadUrl,
  buildId,
}: BuildArtifactsProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(downloadUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-blue-400 hover:text-blue-300 transition-colors underline"
      >
        View Artifacts
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-base">
                Build Artifacts
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-white transition-colors text-lg"
              >
                x
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4 font-mono">
              {buildId.slice(0, 8)}
            </p>

            {/* QR Code */}
            <div className="flex justify-center mb-4 bg-white rounded-lg p-3">
              <QRCode url={downloadUrl} size={200} />
            </div>

            <p className="text-xs text-gray-400 text-center mb-4">
              Scan to install on device
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Download APK
              </a>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                {copied ? "Copied!" : "Share install link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
