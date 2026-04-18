import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin";

/**
 * Register an Expo push token for a tenant. Called by the mobile app on
 * first launch (and on app re-open if the token has changed).
 *
 * Public endpoint — no auth required, but we validate the tenant exists.
 * The proxy exempts this path from auth (see proxy.ts).
 *
 * TODO: rate-limit per IP to prevent abuse. For MVP we rely on the unique
 * (tenant_id, device_token) constraint to keep storage bounded.
 */
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: tenantId } = await context.params;
    const body = await request.json();
    const { device_token, platform } = body as {
      device_token?: string;
      platform?: string;
    };

    if (!device_token || typeof device_token !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid device_token" },
        { status: 400 }
      );
    }
    if (platform !== "ios" && platform !== "android") {
      return NextResponse.json(
        { error: "platform must be 'ios' or 'android'" },
        { status: 400 }
      );
    }

    // Public endpoint: use service-role to bypass RLS (no user session
    // here). The route is exempted from proxy auth — see proxy.ts.
    const supabase = createAdminServiceClient();

    const { error } = await supabase
      .from("push_tokens")
      .upsert(
        {
          tenant_id: tenantId,
          device_token,
          platform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tenant_id,device_token" }
      );

    if (error) {
      console.error("push_tokens upsert failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
