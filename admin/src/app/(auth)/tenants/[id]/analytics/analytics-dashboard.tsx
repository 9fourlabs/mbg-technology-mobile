"use client";

import { useCallback, useEffect, useState } from "react";

type RangeOption = "7d" | "30d" | "90d";

interface AnalyticsData {
  range: string;
  totalEvents: number;
  uniqueUsers: number;
  activeToday: number;
  topScreens: { name: string; count: number }[];
  topEvents: { name: string; count: number }[];
  platforms: { platform: string; users: number }[];
}

export default function AnalyticsDashboard({ tenantId }: { tenantId: string }) {
  const [range, setRange] = useState<RangeOption>("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/analytics?range=${range}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [tenantId, range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const platformSummary = data?.platforms?.map(p => `${p.platform}: ${p.users}`).join(", ") || "---";

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex gap-2">
        {(["7d", "30d", "90d"] as RangeOption[]).map((opt) => (
          <button
            key={opt}
            onClick={() => setRange(opt)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              range === opt
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {opt === "7d" ? "7 days" : opt === "30d" ? "30 days" : "90 days"}
          </button>
        ))}
      </div>

      {/* Loading / error states */}
      {loading && (
        <div className="text-sm text-gray-500">Loading analytics...</div>
      )}
      {error && (
        <div className="text-sm text-red-600">Error: {error}</div>
      )}

      {!loading && !error && data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Events" value={data.totalEvents.toLocaleString()} />
            <StatCard label="Unique Users" value={data.uniqueUsers.toLocaleString()} />
            <StatCard label="Active Today" value={data.activeToday.toLocaleString()} />
            <StatCard label="Platforms" value={platformSummary} />
          </div>

          {/* Top Screens */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Screens</h2>
            {data.topScreens.length === 0 ? (
              <p className="text-sm text-gray-400">No screen view data yet.</p>
            ) : (
              <div className="space-y-2">
                {data.topScreens.map((screen) => {
                  const maxCount = data.topScreens[0]?.count || 1;
                  const pct = Math.round((screen.count / maxCount) * 100);
                  return (
                    <div key={screen.name} className="flex items-center gap-3 text-sm">
                      <span className="w-40 truncate text-gray-700">{screen.name}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-16 text-right text-gray-500 tabular-nums">
                        {screen.count.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Events */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Events</h2>
            {data.topEvents.length === 0 ? (
              <p className="text-sm text-gray-400">No custom event data yet.</p>
            ) : (
              <div className="space-y-2">
                {data.topEvents.map((event) => {
                  const maxCount = data.topEvents[0]?.count || 1;
                  const pct = Math.round((event.count / maxCount) * 100);
                  return (
                    <div key={event.name} className="flex items-center gap-3 text-sm">
                      <span className="w-40 truncate text-gray-700">{event.name}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-16 text-right text-gray-500 tabular-nums">
                        {event.count.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Empty state when everything is zero */}
          {data.totalEvents === 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <p className="text-gray-500 text-sm">
                No analytics data yet. Events will appear here once the mobile app starts sending data.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}
