import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContentRouter from "@/components/content/ContentRouter";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, template_type, business_name, supabase_project_id")
    .eq("id", id)
    .single();

  if (!tenant) {
    notFound();
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/tenants" className="hover:text-gray-900 transition-colors">
          Apps
        </Link>
        <span>/</span>
        <Link
          href={`/tenants/${id}`}
          className="hover:text-gray-900 transition-colors"
        >
          {id}
        </Link>
        <span>/</span>
        <span className="text-gray-900">Content</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Content Management
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {tenant.business_name || id}
        </p>
      </div>

      {!tenant.supabase_project_id ? (
        <div className="rounded-xl bg-amber-50 border border-yellow-200 p-6">
          <p className="text-sm text-amber-700">
            This tenant doesn&apos;t have a Supabase project linked. Set one up
            before managing content.
          </p>
        </div>
      ) : (
        <ContentRouter
          tenantId={id}
          templateType={tenant.template_type}
          businessName={tenant.business_name}
        />
      )}
    </div>
  );
}
