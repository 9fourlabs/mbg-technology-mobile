import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const range = request.nextUrl.searchParams.get("range") ?? "7d";
    const daysBack = range === "30d" ? 30 : range === "90d" ? 90 : 7;
    const since = new Date(Date.now() - daysBack * 86400000).toISOString();

    // Total events
    const { count: totalEvents } = await supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("created_at", since);

    // Unique users (anonymous_id)
    const { data: uniqueUsers } = await supabase
      .from("analytics_events")
      .select("anonymous_id")
      .eq("tenant_id", tenantId)
      .gte("created_at", since);
    const uniqueUserCount = new Set(uniqueUsers?.map(u => u.anonymous_id)).size;

    // Today's active users
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: todayUsers } = await supabase
      .from("analytics_events")
      .select("anonymous_id")
      .eq("tenant_id", tenantId)
      .gte("created_at", todayStart.toISOString());
    const activeToday = new Set(todayUsers?.map(u => u.anonymous_id)).size;

    // Top screens
    const { data: screenEvents } = await supabase
      .from("analytics_events")
      .select("screen_name")
      .eq("tenant_id", tenantId)
      .eq("event_name", "screen_view")
      .gte("created_at", since)
      .not("screen_name", "is", null);

    const screenCounts: Record<string, number> = {};
    screenEvents?.forEach(e => {
      if (e.screen_name) screenCounts[e.screen_name] = (screenCounts[e.screen_name] || 0) + 1;
    });
    const topScreens = Object.entries(screenCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Top events (non screen_view)
    const { data: actionEvents } = await supabase
      .from("analytics_events")
      .select("event_name")
      .eq("tenant_id", tenantId)
      .neq("event_name", "screen_view")
      .gte("created_at", since);

    const eventCounts: Record<string, number> = {};
    actionEvents?.forEach(e => {
      eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1;
    });
    const topEvents = Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Platform breakdown
    const { data: platformEvents } = await supabase
      .from("analytics_events")
      .select("platform, anonymous_id")
      .eq("tenant_id", tenantId)
      .gte("created_at", since);

    const platformUsers: Record<string, Set<string>> = {};
    platformEvents?.forEach(e => {
      if (!platformUsers[e.platform]) platformUsers[e.platform] = new Set();
      platformUsers[e.platform].add(e.anonymous_id);
    });
    const platforms = Object.entries(platformUsers).map(([platform, users]) => ({
      platform,
      users: users.size,
    }));

    return NextResponse.json({
      range,
      totalEvents: totalEvents ?? 0,
      uniqueUsers: uniqueUserCount,
      activeToday,
      topScreens,
      topEvents,
      platforms,
    });
  } catch (error) {
    console.error("Analytics query error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
