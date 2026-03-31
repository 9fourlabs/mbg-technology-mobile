"use client";

import { useState } from "react";

export default function SharePreviewLink({ tenantId }: { tenantId: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}/share/${tenantId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
