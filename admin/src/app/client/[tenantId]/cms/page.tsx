import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/auth/user-context";
import { getResourcesForTemplate } from "@/lib/refine/resource-registry";

/**
 * CMS dashboard for a tenant. Lists each resource (events, posts, listings…)
 * the customer can manage, based on their template_type. Each tile links to
 * the Refine-powered list/create/edit pages at /client/[tenantId]/cms/[resource].
 */
export default async function ClientCmsHome({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const ctx = await getUserContext();
  if (!ctx) redirect("/client/login");

  if (ctx.role === "client" && !ctx.tenantIds.includes(tenantId)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, business_name, template_type")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) notFound();

  const resources = getResourcesForTemplate(tenant.template_type);

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link
          href={`/client/${tenantId}`}
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
        >
          ← Back to {tenant.business_name ?? tenantId}
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">
          Manage your content
        </h1>
        <p className="text-gray-600 mt-1">
          Add, edit, and remove content that appears in your app — updates go
          live immediately.
        </p>
      </div>

      {resources.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
          <h2 className="font-medium text-yellow-900 mb-2">
            No managed content for the {tenant.template_type} template yet
          </h2>
          <p className="text-sm text-yellow-800">
            Content management isn't configured for this template type. Reach
            out to your MBG contact to add it.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((r) => (
            <Link
              key={r.name}
              href={`/client/${tenantId}/cms/${r.name}`}
              className="block bg-white rounded-md border border-gray-200 p-6 hover:border-blue-400 hover:shadow-sm transition"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                {r.pluralLabel}
              </h2>
              <p className="text-sm text-gray-500">{r.description}</p>
              <p className="text-xs text-blue-600 mt-3 font-medium">
                Manage {r.pluralLabel.toLowerCase()} →
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
