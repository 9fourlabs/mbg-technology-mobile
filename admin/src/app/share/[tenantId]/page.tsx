import { createAdminServiceClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import SharePageClient from "./share-page-client";

export default async function SharePreviewPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  // Share pages are publicly accessible (linked in /share is on proxy's PUBLIC_PATHS).
  // Use the service-role client so the query isn't blocked by RLS on tenants.
  // Only brand visuals + appetize key are forwarded to the client — no secrets.
  const supabase = createAdminServiceClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select(
      "id, business_name, config, appetize_public_key, appetize_public_key_ios",
    )
    .eq("id", tenantId)
    .single();

  if (!tenant) {
    notFound();
  }

  // Get latest completed preview build with a download URL
  const { data: builds } = await supabase
    .from("builds")
    .select(
      "id, download_url, download_url_ios, platform, created_at, appetize_public_key, appetize_public_key_ios",
    )
    .eq("tenant_id", tenantId)
    .eq("profile", "preview")
    .eq("status", "completed")
    .not("download_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const config = tenant.config as Record<string, unknown> | null;
  const brand = (config?.brand ?? {}) as Record<string, string>;

  // Prefer the build-scoped key (stamped when the build completed). Fall back
  // to the tenant-level key (updated every successful build). Either surfaces
  // the most recent upload for that platform.
  const tenantRow = tenant as Record<string, unknown>;
  const buildRow = (builds?.[0] ?? {}) as Record<string, unknown>;

  const appetizeKey =
    (buildRow.appetize_public_key as string | null | undefined) ??
    (tenantRow.appetize_public_key as string | null | undefined) ??
    null;
  const appetizeKeyIos =
    (buildRow.appetize_public_key_ios as string | null | undefined) ??
    (tenantRow.appetize_public_key_ios as string | null | undefined) ??
    null;

  return (
    <SharePageClient
      appName={tenant.business_name || "App Preview"}
      primaryColor={brand.primaryColor ?? "#2563EB"}
      logoUrl={brand.logoUrl}
      appetizeKey={appetizeKey}
      appetizeKeyIos={appetizeKeyIos}
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
