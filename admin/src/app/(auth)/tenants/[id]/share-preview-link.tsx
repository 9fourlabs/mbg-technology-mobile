"use client";

import { useState } from "react";

export default function SharePreviewLink({
  tenantId,
  hasPreviewBuild = true,
}: {
  tenantId: string;
  hasPreviewBuild?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}/share/${tenantId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!hasPreviewBuild) {
    return (
      <div className="relative group">
        <button
          disabled
          className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-300 text-sm font-medium text-gray-500 cursor-not-allowed"
        >
          Share
        </button>
        <div className="hidden group-hover:block absolute z-50 bottom-full left-0 mb-2 w-48 p-2 rounded-lg bg-gray-800 text-xs text-white shadow-md">
          Build a preview first before sharing
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
    >
      {copied ? "Link Copied!" : "Share"}
    </button>
  );
}
