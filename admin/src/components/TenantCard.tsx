import Link from "next/link";
import { TEMPLATE_LABELS, STATUS_LABELS } from "@/lib/labels";

interface TenantCardProps {
  id: string;
  template_type: string;
  status: string;
  business_name?: string;
  updated_at: string;
  app_type?: string;
}

const templateColors: Record<string, string> = {
  informational: "bg-gray-50 text-gray-500",
  authenticated: "bg-blue-50 text-blue-600",
  booking: "bg-emerald-50 text-emerald-700",
  commerce: "bg-amber-50 text-amber-700",
  loyalty: "bg-purple-50 text-purple-600",
  content: "bg-orange-50 text-orange-600",
  forms: "bg-teal-50 text-teal-600",
  directory: "bg-indigo-50 text-indigo-600",
};

const statusDotColors: Record<string, string> = {
  draft: "bg-gray-400",
  preview: "bg-amber-500",
  production: "bg-emerald-500",
};

/** Primary CTA label based on app status */
function ctaLabel(status: string): string {
  if (status === "draft") return "Set Up";
  if (status === "preview") return "Share";
  if (status === "production") return "Manage";
  return "Open";
}

export default function TenantCard({
  id,
  template_type,
  status,
  business_name,
  updated_at,
  app_type,
}: TenantCardProps) {
  const isCustom = app_type === "custom";
  const templateLabel = isCustom
    ? "Custom App"
    : TEMPLATE_LABELS[template_type] ?? template_type;
  const statusLabel = STATUS_LABELS[status] ?? status;

  return (
    <Link
      href={`/tenants/${id}`}
      className="block bg-white border border-gray-200 rounded-xl p-6 shadow-2xs hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      {/* Header: name + status dot */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {business_name || id}
          </h3>
          <span className={`mt-1 py-1 px-2 inline-flex items-center text-xs font-medium rounded-full ${templateColors[template_type] ?? "bg-gray-50 text-gray-500"}`}>
            {templateLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`w-2 h-2 rounded-full ${statusDotColors[status] ?? "bg-gray-400"}`} />
          <span className="text-xs text-gray-500">{statusLabel}</span>
        </div>
      </div>

      {/* Updated date */}
      <p className="text-xs text-gray-400 mt-4">
        Updated {new Date(updated_at).toLocaleDateString()}
      </p>

      {/* CTA */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <span className="py-2 px-3 inline-flex items-center gap-x-1 text-xs font-medium rounded-lg bg-blue-600 text-white group-hover:bg-blue-700 transition-colors">
          {ctaLabel(status)}
          <svg className="size-3.5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </span>
      </div>
    </Link>
  );
}
