import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/auth/user-context";
import SendNotificationForm from "./send-form";

export default async function ClientNotificationsPage({
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
    .select("id, business_name")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) notFound();

  // How many devices currently have the app installed (via push_tokens count)
  const { count: deviceCount } = await supabase
    .from("push_tokens")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  return (
    <div>
      <div className="mb-6">
        <Link href={`/client/${tenantId}`} className="text-xs text-emerald-700 hover:underline">
          ← {tenant.business_name ?? tenantId}
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Push notifications</h1>
      <p className="text-sm text-gray-500 mb-6">
        Send a one-off push to everyone who has installed your app.
        {deviceCount !== null && (
          <span className="ml-2 text-gray-700 font-medium">
            {deviceCount} {deviceCount === 1 ? "device" : "devices"} registered.
          </span>
        )}
      </p>

      <SendNotificationForm tenantId={tenantId} />
    </div>
  );
}
