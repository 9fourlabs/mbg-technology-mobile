import Link from "next/link";

interface TenantCardProps {
  id: string;
  template_type: string;
  status: string;
  business_name?: string;
  updated_at: string;
}

const templateColors: Record<string, string> = {
  restaurant: "bg-orange-900/50 text-orange-400",
  church: "bg-purple-900/50 text-purple-400",
  barber: "bg-blue-900/50 text-blue-400",
  beauty: "bg-pink-900/50 text-pink-400",
  fitness: "bg-green-900/50 text-green-400",
  realestate: "bg-teal-900/50 text-teal-400",
  nonprofit: "bg-indigo-900/50 text-indigo-400",
  retail: "bg-yellow-900/50 text-yellow-400",
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
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-6 hover:border-gray-700 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-white group-hover:text-[#2563EB] transition-colors">
            {business_name || id}
          </h3>
          {business_name && (
            <p className="text-xs text-gray-500 mt-0.5">{id}</p>
          )}
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status] ?? "bg-gray-700 text-gray-300"}`}
        >
          {status}
        </span>
      </div>

      <div className="mb-4">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${templateColors[template_type] ?? "bg-gray-700 text-gray-300"}`}
        >
          {template_type}
        </span>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Updated {new Date(updated_at).toLocaleDateString()}
      </p>

      <div className="flex gap-3">
        <Link
          href={`/tenants/${id}`}
          className="text-sm text-[#2563EB] hover:underline font-medium"
        >
          Edit
        </Link>
        <Link
          href={`/tenants/${id}/builds`}
          className="text-sm text-gray-400 hover:text-white transition-colors font-medium"
        >
          Build
        </Link>
      </div>
    </div>
  );
}
