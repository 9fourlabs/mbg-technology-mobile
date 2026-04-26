import { NextRequest, NextResponse } from "next/server";
import { createCompatClient } from "@/lib/admin-db/shim";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events } = body;

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "No events provided" }, { status: 400 });
    }

    // Limit batch size
    const batch = events.slice(0, 100);

    const supabase = createCompatClient();

    const { error } = await supabase.from("analytics_events").insert(batch);

    if (error) {
      console.error("Analytics insert error:", error);
      return NextResponse.json({ error: "Failed to store events" }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: batch.length });
  } catch (error) {
    console.error("Analytics ingest error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
