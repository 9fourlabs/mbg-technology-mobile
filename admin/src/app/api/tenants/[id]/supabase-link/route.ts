import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/auth/user-context";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: tenantId } = await params;
  const ctx = await getUserContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.role !== "admin" && !ctx.tenantIds.includes(tenantId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    supabase_url?: string | null;
    supabase_anon_key?: string | null;
  };
  if (!body.supabase_url) {
    return NextResponse.json(
      { error: "supabase_url is required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tenants")
    .update({
      supabase_url: body.supabase_url.trim(),
      supabase_anon_key: body.supabase_anon_key?.trim() || null,
      supabase_project_id: body.supabase_url.trim(),
    })
    .eq("id", tenantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
