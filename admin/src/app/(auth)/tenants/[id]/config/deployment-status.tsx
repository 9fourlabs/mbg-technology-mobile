"use client";

type BuildSummary = {
  config_hash: string | null;
  created_at: string;
} | null;

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function Row({
  label,
  draftHash,
  build,
}: {
  label: string;
  draftHash: string | null;
  build: BuildSummary;
}) {
  if (!build) {
    return (
      <div className="flex items-center justify-between text-sm py-1">
        <span className="text-gray-600">{label}</span>
        <span className="inline-flex items-center gap-1.5 text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          Not built yet
        </span>
      </div>
    );
  }

  const dirty =
    draftHash !== null &&
    build.config_hash !== null &&
    draftHash !== build.config_hash;
  const unknown = build.config_hash === null;

  if (unknown) {
    return (
      <div className="flex items-center justify-between text-sm py-1">
        <span className="text-gray-600">{label}</span>
        <span className="inline-flex items-center gap-1.5 text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          Built {formatRelative(build.created_at)} (pre-tracking)
        </span>
      </div>
    );
  }

  if (dirty) {
    return (
      <div className="flex items-center justify-between text-sm py-1">
        <span className="text-gray-600">{label}</span>
        <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Unpublished changes
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-gray-600">{label}</span>
      <span className="inline-flex items-center gap-1.5 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Up to date &middot; built {formatRelative(build.created_at)}
      </span>
    </div>
  );
}

export default function DeploymentStatus({
  draftHash,
  latestPreview,
  latestProduction,
}: {
  draftHash: string | null;
  latestPreview: BuildSummary;
  latestProduction: BuildSummary;
}) {
  const anyDirty =
    draftHash !== null &&
    ((latestPreview?.config_hash && latestPreview.config_hash !== draftHash) ||
      (latestProduction?.config_hash &&
        latestProduction.config_hash !== draftHash));

  return (
    <div
      className={`rounded-lg border px-4 py-3 mb-4 ${
        anyDirty
          ? "bg-amber-50 border-amber-200"
          : "bg-gray-50 border-gray-200"
      }`}
    >
      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
        Deployment Status
      </p>
      <Row label="Preview" draftHash={draftHash} build={latestPreview} />
      <Row label="Production" draftHash={draftHash} build={latestProduction} />
      {anyDirty && (
        <p className="text-xs text-amber-700 mt-2">
          Click <strong>Save &amp; Build</strong> to push these changes to preview.
        </p>
      )}
    </div>
  );
}
