import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/auth/user-context";

interface TenantRow {
  id: string;
  business_name: string | null;
  template_type: string;
  status: string;
  config: Record<string, unknown> | null;
}

export default async function ClientTenantHome({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const ctx = await getUserContext();
  if (!ctx) redirect("/client/login");

  // Authorization: admin can see anything; client must own this tenant.
  if (ctx.role === "client" && !ctx.tenantIds.includes(tenantId)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, business_name, template_type, status, config")
    .eq("id", tenantId)
    .maybeSingle<TenantRow>();

  if (!tenant) notFound();

  // Quick-jump cards. The actual content/analytics surfaces will be filled in
  // by the next workstream (#6) — for now they're stubs.
  const sections: Array<{
    label: string;
    href: string;
    description: string;
    enabled: boolean;
  }> = [
    {
      label: "Manage content",
      href: `/client/${tenantId}/cms`,
      description: "Add, edit, and remove the events, posts, listings, and other dynamic content that appears in your app. Updates are live immediately.",
      enabled: true,
    },
    {
      label: "Content (legacy)",
      href: `/client/${tenantId}/content`,
      description: "The original direct-table editor — same data, raw view. Most clients should use Manage Content above.",
      enabled: true,
    },
    {
      label: "Push notifications",
      href: `/client/${tenantId}/notifications`,
      description: "Send announcements to everyone who has installed the app.",
      enabled: true,
    },
    {
      label: "Analytics",
      href: `/client/${tenantId}/analytics`,
      description: "Active users, screen views, and engagement.",
      enabled: true,
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <Link href="/client" className="text-xs text-emerald-700 hover:underline">
          ← All apps
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900">
        {tenant.business_name ?? tenant.id}
      </h1>
      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 mb-8">
        <span className="capitalize">{tenant.template_type}</span>
        <span>·</span>
        <span className="capitalize">{tenant.status}</span>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="block h-full rounded-xl bg-white border border-gray-200 p-5 hover:border-emerald-400 transition"
            >
              <div className="font-semibold text-gray-900">{s.label}</div>
              <div className="text-xs text-gray-500 mt-2 leading-relaxed">{s.description}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
