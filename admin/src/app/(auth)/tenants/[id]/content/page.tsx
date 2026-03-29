import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, template_type, business_name")
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

      <div className="rounded-xl bg-gray-900 border border-gray-800 p-12 text-center">
        <div className="text-4xl mb-4">
          {tenant.template_type === "restaurant"
            ? "\u{1F354}"
            : tenant.template_type === "church"
              ? "\u{26EA}"
              : tenant.template_type === "barber"
                ? "\u2702\uFE0F"
                : tenant.template_type === "beauty"
                  ? "\u{1F484}"
                  : tenant.template_type === "fitness"
                    ? "\u{1F3CB}\uFE0F"
                    : tenant.template_type === "realestate"
                      ? "\u{1F3E0}"
                      : tenant.template_type === "nonprofit"
                        ? "\u{1F91D}"
                        : "\u{1F6CD}\uFE0F"}
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">
          Content management for{" "}
          <span className="capitalize">{tenant.template_type}</span>
        </h2>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          The content editor for {tenant.template_type} templates is coming soon.
          This will allow you to manage template-specific content like menus,
          services, listings, and more.
        </p>
        <Link
          href={`/tenants/${id}`}
          className="inline-flex items-center mt-6 px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
        >
          Back to Tenant
        </Link>
      </div>
    </div>
  );
}
