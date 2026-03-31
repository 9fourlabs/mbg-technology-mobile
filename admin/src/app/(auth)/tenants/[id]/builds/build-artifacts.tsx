"use client";

import { useState } from "react";
import QRCode from "@/components/QRCode";

interface BuildArtifactsProps {
  downloadUrl: string;
  downloadUrlIos?: string | null;
  buildId: string;
}

export default function BuildArtifacts({
  downloadUrl,
  downloadUrlIos,
  buildId,
}: BuildArtifactsProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  function handleCopy(url: string, platform: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(platform);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-blue-600 hover:text-blue-700 transition-colors underline"
      >
        View Artifacts
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-sm w-full mx-4 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900 font-semibold text-base">
                Build Artifacts
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-900 transition-colors text-lg"
              >
                x
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-4 font-mono">
              {buildId.slice(0, 8)}
            </p>

            {/* Android */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 font-medium mb-2">Android</p>
              <div className="flex justify-center mb-2 bg-white rounded-lg p-3">
                <QRCode url={downloadUrl} size={180} />
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Download APK
                </a>
                <button
                  onClick={() => handleCopy(downloadUrl, "android")}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-100 transition-colors"
                >
                  {copied === "android" ? "Copied!" : "Copy link"}
                </button>
              </div>
            </div>

            {/* iOS */}
            {downloadUrlIos && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 font-medium mb-2">iOS</p>
                <div className="flex justify-center mb-2 bg-white rounded-lg p-3">
                  <QRCode url={downloadUrlIos} size={180} />
                </div>
                <div className="flex flex-col gap-2">
                  <a
                    href={downloadUrlIos}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Install on iOS
                  </a>
                  <button
                    onClick={() => handleCopy(downloadUrlIos, "ios")}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-100 transition-colors"
                  >
                    {copied === "ios" ? "Copied!" : "Copy link"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
