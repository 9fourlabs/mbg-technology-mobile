import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SharePageClient from "./share-page-client";

export default async function SharePreviewPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, business_name, config")
    .eq("id", tenantId)
    .single();

  if (!tenant) {
    notFound();
  }

  // Get latest completed preview build with a download URL
  const { data: builds } = await supabase
    .from("builds")
    .select("id, download_url, platform, created_at")
    .eq("tenant_id", tenantId)
    .eq("profile", "preview")
    .eq("status", "completed")
    .not("download_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const config = tenant.config as Record<string, unknown> | null;
  const brand = (config?.brand ?? {}) as Record<string, string>;

  return (
    <SharePageClient
      appName={tenant.business_name || "App Preview"}
      primaryColor={brand.primaryColor ?? "#2563EB"}
      logoUrl={brand.logoUrl}
      builds={
        builds?.map((b) => ({
          id: b.id,
          downloadUrl: b.download_url,
          platform: b.platform ?? "android",
          createdAt: b.created_at,
        })) ?? []
      }
    />
  );
}
