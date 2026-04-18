import { NextRequest, NextResponse } from "next/server";
import { createAdminServiceClient } from "@/lib/supabase/admin";
import { getUserContext } from "@/lib/auth/user-context";

/**
 * Send a push notification to every device registered for the tenant.
 *
 * Auth: admin can send to any tenant; clients can send only to tenants they
 * own. Uses the Expo Push API (https://exp.host/--/api/v2/push/send) — no
 * APNs/FCM credentials needed at the send layer (those are bound at the
 * build/registration layer).
 *
 * Batches up to 100 tokens per request per Expo's limits.
 */
type RouteContext = { params: Promise<{ id: string }> };

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 100;

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: tenantId } = await context.params;

    // Authorize.
    const ctx = await getUserContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (ctx.role !== "admin" && !ctx.tenantIds.includes(tenantId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, body, data } = (await request.json()) as {
      title?: string;
      body?: string;
      data?: Record<string, unknown>;
    };
    if (!title || !body) {
      return NextResponse.json(
        { error: "Both 'title' and 'body' are required" },
        { status: 400 }
      );
    }

    // Service-role read so we don't depend on tenant-scoped RLS for the
    // push_tokens table (the route has already done its own authorization).
    const supabase = createAdminServiceClient();
    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("device_token, platform")
      .eq("tenant_id", tenantId);

    if (tokensError) {
      return NextResponse.json({ error: tokensError.message }, { status: 500 });
    }
    if (!tokens || tokens.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, message: "No registered devices" });
    }

    const allTokens = tokens.map((t) => t.device_token);
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < allTokens.length; i += BATCH_SIZE) {
      const batch = allTokens.slice(i, i + BATCH_SIZE);
      const messages = batch.map((to) => ({
        to,
        sound: "default",
        title,
        body,
        data: data ?? {},
      }));

      try {
        const res = await fetch(EXPO_PUSH_URL, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messages),
        });
        const json = (await res.json()) as {
          data?: Array<{ status: string; message?: string; details?: unknown }>;
          errors?: Array<{ message: string }>;
        };

        if (json.errors?.length) {
          errors.push(...json.errors.map((e) => e.message));
          failed += batch.length;
          continue;
        }
        for (const ticket of json.data ?? []) {
          if (ticket.status === "ok") sent++;
          else failed++;
        }
      } catch (err) {
        errors.push(err instanceof Error ? err.message : "Unknown push error");
        failed += batch.length;
      }
    }

    // Audit log.
    try {
      await supabase.from("activity_log").insert({
        tenant_id: tenantId,
        action: "push_notification_sent",
        details: `${title} (sent ${sent}, failed ${failed})`,
        user_email: ctx.user.email,
      });
    } catch {
      // Non-fatal.
    }

    return NextResponse.json({
      sent,
      failed,
      total: allTokens.length,
      errors: errors.slice(0, 5),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
