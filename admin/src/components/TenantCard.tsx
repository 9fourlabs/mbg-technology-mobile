import Link from "next/link";

interface TenantCardProps {
  id: string;
  template_type: string;
  status: string;
  business_name?: string;
  updated_at: string;
}

const templateColors: Record<string, string> = {
  informational: "bg-gray-900/50 text-gray-400",
  authenticated: "bg-blue-900/50 text-blue-400",
  booking: "bg-green-900/50 text-green-400",
  commerce: "bg-yellow-900/50 text-yellow-400",
  loyalty: "bg-purple-900/50 text-purple-400",
  content: "bg-orange-900/50 text-orange-400",
  forms: "bg-teal-900/50 text-teal-400",
  directory: "bg-indigo-900/50 text-indigo-400",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-700 text-gray-300",
  preview: "bg-yellow-900/50 text-yellow-400",
  production: "bg-green-900/50 text-green-400",
};

export default function TenantCard({
  id,
  template_type,
  status,
  business_name,
  updated_at,
}: TenantCardProps) {
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-6 hover:border-gray-700 transition-colors">
      {/* Business name + tenant ID */}
      <h3 className="text-base font-semibold text-white">
        {business_name || id}
      </h3>
      {business_name && (
        <p className="text-xs text-gray-500 mt-0.5">{id}</p>
      )}

      {/* Template + Status badges */}
      <div className="flex items-center gap-2 mt-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${templateColors[template_type] ?? "bg-gray-700 text-gray-300"}`}
        >
          {template_type}
        </span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status] ?? "bg-gray-700 text-gray-300"}`}
        >
          {status}
        </span>
      </div>

      {/* Updated date */}
      <p className="text-xs text-gray-500 mt-3">
        Updated {new Date(updated_at).toLocaleDateString()}
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-800">
        <Link
          href={`/tenants/${id}`}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-xs font-medium text-white transition-colors"
        >
          View
        </Link>
        <Link
          href={`/tenants/${id}/builds`}
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 text-xs font-medium text-gray-300 hover:text-white transition-colors"
        >
          Builds
        </Link>
      </div>
    </div>
  );
}
