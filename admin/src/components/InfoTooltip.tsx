"use client";

/**
 * Tiny info (ⓘ) icon with a hover/focus tooltip. Pure CSS — no runtime JS.
 *
 *   <InfoTooltip text="Rounded cards feel friendlier; sharp corners feel serious." />
 *   <InfoTooltip
 *     text="The name shown under the app icon. Max 30 chars on Apple."
 *     side="right"
 *   />
 *
 * Meant for inline help next to a form label. Hit the icon with a real
 * sentence in plain English — no jargon, no developer speak.
 */
export default function InfoTooltip({
  text,
  side = "top",
  className = "",
}: {
  text: string;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}) {
  const sideClass =
    side === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
      : side === "bottom"
        ? "top-full left-1/2 -translate-x-1/2 mt-2"
        : side === "right"
          ? "left-full top-1/2 -translate-y-1/2 ml-2"
          : "right-full top-1/2 -translate-y-1/2 mr-2";

  return (
    <span className={`relative inline-flex group align-middle ${className}`}>
      <button
        type="button"
        aria-label="More info"
        tabIndex={0}
        className="inline-flex items-center justify-center size-4 rounded-full text-gray-400 hover:text-gray-700 focus:outline-hidden focus-visible:text-gray-900 focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 ${sideClass} w-64 rounded-md bg-gray-900 px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100`}
      >
        {text}
      </span>
    </span>
  );
}
