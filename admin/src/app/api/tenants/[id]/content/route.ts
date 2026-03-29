import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTenantClient } from "@/lib/supabase/tenant";
import { getProjectApiKeys } from "@/lib/supabase/management";

// ── Allow-list per template type ────────────────────────────────────────────
const ALLOWLIST: Record<string, string[]> = {
  booking: ["services", "time_slots", "bookings"],
  commerce: ["categories", "products", "orders", "order_items"],
  content: ["posts", "bookmarks"],
  directory: ["directory_items"],
  forms: ["form_submissions"],
  loyalty: [
    "loyalty_rewards",
    "loyalty_transactions",
    "loyalty_accounts",
  ],
};

// Tables that only support GET (no mutations from admin)
const READ_ONLY = [
  "bookings",
  "orders",
  "order_items",
  "bookmarks",
  "loyalty_transactions",
  "loyalty_accounts",
];

// form_submissions: allow PUT (status update) but not POST/DELETE
const STATUS_UPDATE_ONLY = ["form_submissions"];

// ── Helpers ─────────────────────────────────────────────────────────────────

async function authenticate() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null };
  return { supabase, user };
}

async function getTenantClient(tenantId: string) {
  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("template_type, supabase_project_id, supabase_url")
    .eq("id", tenantId)
    .single();

  if (!tenant?.supabase_project_id) {
    throw new Error("Tenant has no Supabase project");
  }

  const { serviceRoleKey } = await getProjectApiKeys(
    tenant.supabase_project_id,
  );
  const client = createTenantClient(tenant.supabase_url!, serviceRoleKey);
  return { client, templateType: tenant.template_type };
}

function validateTable(
  templateType: string,
  table: string | null,
): string | null {
  if (!table) return "Missing 'table' query parameter";
  const allowed = ALLOWLIST[templateType];
  if (!allowed || !allowed.includes(table)) {
    return `Table '${table}' is not allowed for template type '${templateType}'`;
  }
  return null; // valid
}

// ── Route params type ───────────────────────────────────────────────────────
type RouteContext = { params: Promise<{ id: string }> };

// ── GET ─────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { user } = await authenticate();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tenantId } = await context.params;
    const { client, templateType } = await getTenantClient(tenantId);

    const searchParams = request.nextUrl.searchParams;
    const table = searchParams.get("table");

    const validationError = validateTable(templateType, table);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 403 });
    }

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = Math.max(
      1,
      parseInt(searchParams.get("pageSize") ?? "25", 10),
    );
    const orderBy = searchParams.get("orderBy") ?? "created_at";
    const ascending = searchParams.get("ascending") === "true";

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await client
      .from(table!)
      .select("*", { count: "exact" })
      .order(orderBy, { ascending })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST ────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { user } = await authenticate();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tenantId } = await context.params;
    const { client, templateType } = await getTenantClient(tenantId);

    const table = request.nextUrl.searchParams.get("table");

    const validationError = validateTable(templateType, table);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 403 });
    }

    if (READ_ONLY.includes(table!) || STATUS_UPDATE_ONLY.includes(table!)) {
      return NextResponse.json(
        { error: `POST is not allowed on '${table}'` },
        { status: 403 },
      );
    }

    const body = await request.json();

    const { data, error } = await client
      .from(table!)
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── PUT ─────────────────────────────────────────────────────────────────────
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { user } = await authenticate();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tenantId } = await context.params;
    const { client, templateType } = await getTenantClient(tenantId);

    const searchParams = request.nextUrl.searchParams;
    const table = searchParams.get("table");
    const rowId = searchParams.get("rowId");

    const validationError = validateTable(templateType, table);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 403 });
    }

    if (READ_ONLY.includes(table!)) {
      return NextResponse.json(
        { error: `PUT is not allowed on '${table}'` },
        { status: 403 },
      );
    }

    if (!rowId) {
      return NextResponse.json(
        { error: "Missing 'rowId' query parameter" },
        { status: 400 },
      );
    }

    const body = await request.json();

    const { data, error } = await client
      .from(table!)
      .update(body)
      .eq("id", rowId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { user } = await authenticate();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tenantId } = await context.params;
    const { client, templateType } = await getTenantClient(tenantId);

    const searchParams = request.nextUrl.searchParams;
    const table = searchParams.get("table");
    const rowId = searchParams.get("rowId");

    const validationError = validateTable(templateType, table);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 403 });
    }

    if (READ_ONLY.includes(table!) || STATUS_UPDATE_ONLY.includes(table!)) {
      return NextResponse.json(
        { error: `DELETE is not allowed on '${table}'` },
        { status: 403 },
      );
    }

    if (!rowId) {
      return NextResponse.json(
        { error: "Missing 'rowId' query parameter" },
        { status: 400 },
      );
    }

    const { error } = await client.from(table!).delete().eq("id", rowId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
