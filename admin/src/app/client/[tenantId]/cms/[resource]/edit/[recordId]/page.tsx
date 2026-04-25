import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/auth/user-context";
import { getResourceDefinition } from "@/lib/refine/resource-registry";
import { CmsRefineApp } from "@/components/cms/CmsRefineApp";

interface Props {
  params: Promise<{
    tenantId: string;
    resource: string;
    recordId: string;
  }>;
}

export default async function ResourceEditPage({ params }: Props) {
  const { tenantId, resource: resourceName, recordId } = await params;

  const ctx = await getUserContext();
  if (!ctx) redirect("/client/login");

  if (ctx.role === "client" && !ctx.tenantIds.includes(tenantId)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, template_type")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) notFound();

  const resource = getResourceDefinition(tenant.template_type, resourceName);
  if (!resource) notFound();

  return (
    <CmsRefineApp
      tenantId={tenantId}
      templateType={tenant.template_type}
      resource={resource}
      action="edit"
      recordId={recordId}
    />
  );
}
