import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/auth/user-context";
import ContentRouter from "@/components/content/ContentRouter";

export default async function ClientContentPage({
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
    .select("id, business_name, template_type, supabase_project_id, supabase_url")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) notFound();

  const hasSupabase = !!(tenant.supabase_project_id || tenant.supabase_url);

  return (
    <div>
      <div className="mb-6">
        <Link href={`/client/${tenantId}`} className="text-xs text-emerald-700 hover:underline">
          ← {tenant.business_name ?? tenantId}
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Content</h1>
      <p className="text-sm text-gray-500 mb-6">
        Add, edit, and remove the content shown in your app.
      </p>

      {!hasSupabase ? (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-6 text-sm text-amber-800">
          Content management isn&apos;t set up yet for this app. Your MBG account manager
          needs to provision a Supabase project before you can manage dynamic content.
        </div>
      ) : (
        <ContentRouter
          tenantId={tenantId}
          templateType={tenant.template_type}
          businessName={tenant.business_name ?? tenantId}
        />
      )}
    </div>
  );
}
