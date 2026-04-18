import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/auth/user-context";

interface TenantRow {
  id: string;
  business_name: string | null;
  template_type: string;
  status: string;
}

export default async function ClientHomePage() {
  const ctx = await getUserContext();
  if (!ctx) redirect("/client/login");

  const supabase = await createClient();

  // Admins see all tenants; clients see only theirs (RLS does the scoping
  // automatically, but we filter explicitly for clarity).
  let query = supabase
    .from("tenants")
    .select("id, business_name, template_type, status")
    .order("business_name", { ascending: true });

  if (ctx.role === "client") {
    if (ctx.tenantIds.length === 0) {
      return (
        <div className="rounded-xl bg-white border border-gray-200 p-8 text-center">
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Welcome</h1>
          <p className="text-sm text-gray-600">
            Your account isn&apos;t linked to any apps yet. Contact your MBG account manager
            to get access.
          </p>
        </div>
      );
    }
    query = query.in("id", ctx.tenantIds);
  }

  const { data: tenants, error } = await query;
  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-sm text-red-800">
        Failed to load apps: {error.message}
      </div>
    );
  }

  // If a client owns exactly one tenant, jump straight there.
  if (ctx.role === "client" && tenants && tenants.length === 1) {
    redirect(`/client/${tenants[0].id}`);
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Your apps</h1>
      <p className="text-sm text-gray-500 mb-6">
        {ctx.role === "admin"
          ? "Browsing all tenants as MBG admin."
          : "Pick an app to manage its content and view recent activity."}
      </p>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(tenants as TenantRow[] | null)?.map((t) => (
          <li key={t.id}>
            <Link
              href={`/client/${t.id}`}
              className="block rounded-xl bg-white border border-gray-200 p-5 hover:border-emerald-400 transition"
            >
              <div className="font-semibold text-gray-900">
                {t.business_name ?? t.id}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                <span className="capitalize">{t.template_type}</span>
                <span>·</span>
                <span className="capitalize">{t.status}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
