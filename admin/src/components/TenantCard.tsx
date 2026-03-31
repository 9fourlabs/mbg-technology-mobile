import Link from "next/link";

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

const statusColors: Record<string, string> = {
  draft: "bg-gray-200 text-gray-600",
  preview: "bg-amber-50 text-amber-700",
  production: "bg-emerald-50 text-emerald-700",
};

const customColor = "bg-cyan-50 text-cyan-600";

export default function TenantCard({
  id,
  template_type,
  status,
  business_name,
  updated_at,
  app_type,
}: TenantCardProps) {
  const isCustom = app_type === "custom";
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-6 hover:border-gray-300 transition-colors">
      {/* Business name + tenant ID */}
      <h3 className="text-base font-semibold text-gray-900">
        {business_name || id}
      </h3>
      {business_name && (
        <p className="text-xs text-gray-500 mt-0.5">{id}</p>
      )}

      {/* Template + Status badges */}
      <div className="flex items-center gap-2 mt-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isCustom ? customColor : (templateColors[template_type] ?? "bg-gray-200 text-gray-600")}`}
        >
          {isCustom ? "Custom App" : template_type}
        </span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status] ?? "bg-gray-200 text-gray-600"}`}
        >
          {status}
        </span>
      </div>

      {/* Updated date */}
      <p className="text-xs text-gray-500 mt-3">
        Updated {new Date(updated_at).toLocaleDateString()}
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
        <Link
          href={`/tenants/${id}`}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white transition-colors"
        >
          View
        </Link>
        <Link
          href={`/tenants/${id}/builds`}
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Builds
        </Link>
      </div>
    </div>
  );
}
