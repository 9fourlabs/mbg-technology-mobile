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
      className="inline-flex items-center px-4 py-2 rounded-lg bg-[#2563EB] text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors"
    >
      {copied ? "Link Copied!" : "Share Preview"}
    </button>
  );
}
