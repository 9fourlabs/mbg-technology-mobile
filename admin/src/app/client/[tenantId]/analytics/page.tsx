import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/auth/user-context";
import InfoTooltip from "@/components/InfoTooltip";

interface EventRow {
  event_name: string;
  screen_name: string | null;
  platform: string | null;
  created_at: string;
}

export default async function ClientAnalyticsPage({
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

  // Last 30 days summary (read-only client view).
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { count: totalEvents } = await supabase
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .gte("created_at", thirtyDaysAgo);

  const { data: recent } = await supabase
    .from("analytics_events")
    .select("event_name, screen_name, platform, created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(20);

  // Top screens (manual aggregation since we're avoiding a server-side group-by RPC)
  const { data: forScreens } = await supabase
    .from("analytics_events")
    .select("screen_name")
    .eq("tenant_id", tenantId)
    .gte("created_at", thirtyDaysAgo)
    .not("screen_name", "is", null)
    .limit(2000);

  const screenCounts = new Map<string, number>();
  (forScreens ?? []).forEach((e) => {
    const key = (e.screen_name as string | null) ?? "(none)";
    screenCounts.set(key, (screenCounts.get(key) ?? 0) + 1);
  });
  const topScreens = [...screenCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <Link href={`/client/${tenantId}`} className="text-xs text-emerald-700 hover:underline">
          ← {tenant.business_name ?? tenantId}
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Analytics</h1>
      <p className="text-sm text-gray-500 mb-6">Last 30 days.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl bg-white border border-gray-200 p-5">
          <div className="text-xs uppercase tracking-wide text-gray-500 inline-flex items-center gap-2">
            Events
            <InfoTooltip text="Every screen view and tracked button tap counts as one event. Low numbers early are normal. Look at what events are happening (below) — not just the total." />
          </div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">
            {(totalEvents ?? 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 inline-flex items-center gap-2">
            Top screens
            <InfoTooltip text="The most-viewed screens over the last 30 days. Home is almost always #1 — what matters is what's in the 2nd–5th slots. That's what users actually care about." />
          </h2>
          {topScreens.length === 0 ? (
            <p className="text-sm text-gray-500">No screen views recorded yet.</p>
          ) : (
            <ul className="text-sm divide-y divide-gray-100">
              {topScreens.map(([screen, count]) => (
                <li key={screen} className="flex items-center justify-between py-2">
                  <span className="text-gray-700">{screen}</span>
                  <span className="text-gray-500 font-mono">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 inline-flex items-center gap-2">
            Recent activity
            <InfoTooltip text="A log of the last 20 events, newest first. Useful for spot-checking — 'did that update we just published start driving traffic?' Not meant for reporting." />
          </h2>
          {!recent || recent.length === 0 ? (
            <p className="text-sm text-gray-500">No recent events.</p>
          ) : (
            <ul className="text-xs divide-y divide-gray-100">
              {(recent as EventRow[]).map((e, i) => (
                <li key={i} className="flex items-center justify-between py-1.5 gap-3">
                  <span className="text-gray-700 truncate">{e.event_name}</span>
                  <span className="text-gray-400 whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
