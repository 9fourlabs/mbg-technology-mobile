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
        <Link href="/tenants" className="hover:text-white transition-colors">
          Tenants
        </Link>
        <span>/</span>
        <Link
          href={`/tenants/${id}`}
          className="hover:text-white transition-colors"
        >
          {id}
        </Link>
        <span>/</span>
        <span className="text-white">Content</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">
          Content Management
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {tenant.business_name || id}
        </p>
      </div>

      {!tenant.supabase_project_id ? (
        <div className="rounded-xl bg-yellow-900/20 border border-yellow-800 p-6">
          <p className="text-sm text-yellow-400">
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
