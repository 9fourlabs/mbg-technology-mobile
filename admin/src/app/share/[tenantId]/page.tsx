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
    .select("id, business_name, config, appetize_public_key")
    .eq("id", tenantId)
    .single();

  if (!tenant) {
    notFound();
  }

  // Get latest completed preview build with a download URL
  const { data: builds } = await supabase
    .from("builds")
    .select("id, download_url, download_url_ios, platform, created_at, appetize_public_key")
    .eq("tenant_id", tenantId)
    .eq("profile", "preview")
    .eq("status", "completed")
    .not("download_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const config = tenant.config as Record<string, unknown> | null;
  const brand = (config?.brand ?? {}) as Record<string, string>;

  // Use the most recent Appetize key (from the latest build, or the tenant-level fallback)
  const appetizeKey =
    builds?.[0]?.appetize_public_key ??
    (tenant as Record<string, unknown>).appetize_public_key as string | null ??
    null;

  return (
    <SharePageClient
      appName={tenant.business_name || "App Preview"}
      primaryColor={brand.primaryColor ?? "#2563EB"}
      logoUrl={brand.logoUrl}
      appetizeKey={appetizeKey}
      builds={
        builds?.map((b) => ({
          id: b.id,
          downloadUrl: b.download_url,
          downloadUrlIos: b.download_url_ios,
          platform: b.platform ?? "android",
          createdAt: b.created_at,
        })) ?? []
      }
    />
  );
}
