import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTenantClient } from "@/lib/supabase/tenant";
import { getProjectApiKeys } from "@/lib/supabase/management";
import { PocketbaseClient } from "@/lib/pocketbase/client";
import { PB_ADMIN_EMAIL } from "@/lib/pocketbase/constants";
import { getUserContext } from "@/lib/auth/user-context";

// ── Allow-list per template type ────────────────────────────────────────────
const ALLOWLIST: Record<string, string[]> = {
  booking: ["services", "time_slots", "bookings"],
  commerce: ["categories", "products", "orders", "order_items"],
  content: ["posts", "bookmarks", "events"],
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

/**
 * Authorize the request against the tenant. Admins pass for any tenant;
 * client users pass only for tenants they own. Returns null on 401/403.
 */
async function authorize(tenantId: string): Promise<NextResponse | null> {
  const ctx = await getUserContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (ctx.role !== "admin" && !ctx.tenantIds.includes(tenantId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

type SupabaseBackend = {
  kind: "supabase";
  client: Awaited<ReturnType<typeof createTenantClient>>;
  templateType: string;
};

type PocketbaseBackend = {
  kind: "pocketbase";
  client: PocketbaseClient;
  templateType: string;
};

type TenantBackend = SupabaseBackend | PocketbaseBackend;

/**
 * Returns a client for reading/writing the tenant's per-tenant data,
 * either from their Supabase project OR their dedicated Pocketbase instance,
 * based on the `backend` column on the tenants row.
 */
async function getTenantBackend(tenantId: string): Promise<TenantBackend> {
  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select(
      "template_type, backend, supabase_project_id, supabase_url, pocketbase_url",
    )
    .eq("id", tenantId)
    .single();

  if (!tenant) throw new Error("Tenant not found");

  if (tenant.backend === "pocketbase") {
    if (!tenant.pocketbase_url) {
      throw new Error(
        "Tenant backend is 'pocketbase' but pocketbase_url is not set",
      );
    }
    const adminPassword = process.env.PB_ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error(
        "PB_ADMIN_PASSWORD must be set to talk to tenant PB instances",
      );
    }
    return {
      kind: "pocketbase",
      client: new PocketbaseClient({
        url: tenant.pocketbase_url,
        adminEmail: PB_ADMIN_EMAIL,
        adminPassword,
      }),
      templateType: tenant.template_type,
    };
  }

  // Default: Supabase backend
  if (!tenant.supabase_project_id) {
    throw new Error("Tenant has no Supabase project");
  }
  const { serviceRoleKey } = await getProjectApiKeys(
    tenant.supabase_project_id,
  );
  const client = createTenantClient(tenant.supabase_url!, serviceRoleKey);
  return { kind: "supabase", client, templateType: tenant.template_type };
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

/**
 * PB records carry system fields `created` / `updated`. Alias them as
 * `created_at` / `updated_at` so the admin UI (which assumes Supabase-shaped
 * rows) doesn't need to know which backend it's talking to.
 */
function pbToRow(record: Record<string, unknown>): Record<string, unknown> {
  return {
    ...record,
    created_at: record.created,
    updated_at: record.updated,
  };
}

// ── Route params type ───────────────────────────────────────────────────────
type RouteContext = { params: Promise<{ id: string }> };

// ── GET ─────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: tenantId } = await context.params;
    const denied = await authorize(tenantId);
    if (denied) return denied;

    const backend = await getTenantBackend(tenantId);

    const searchParams = request.nextUrl.searchParams;
    const table = searchParams.get("table");

    const validationError = validateTable(backend.templateType, table);
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

    if (backend.kind === "pocketbase") {
      // PB uses its own system fields `created` / `updated` — translate the
      // admin UI's default of `created_at` so ordering still works.
      const pbSort = `${ascending ? "+" : "-"}${
        orderBy === "created_at"
          ? "created"
          : orderBy === "updated_at"
          ? "updated"
          : orderBy
      }`;
      const result = await backend.client.list(table!, {
        page,
        perPage: pageSize,
        sort: pbSort,
      });
      return NextResponse.json({
        data: result.items.map((r) => pbToRow(r as Record<string, unknown>)),
        count: result.totalItems,
      });
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await backend.client
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
    const { id: tenantId } = await context.params;
    const denied = await authorize(tenantId);
    if (denied) return denied;

    const backend = await getTenantBackend(tenantId);

    const table = request.nextUrl.searchParams.get("table");

    const validationError = validateTable(backend.templateType, table);
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

    if (backend.kind === "pocketbase") {
      const record = await backend.client.create(table!, body);
      return NextResponse.json(
        { data: pbToRow(record as Record<string, unknown>) },
        { status: 201 },
      );
    }

    const { data, error } = await backend.client
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
    const { id: tenantId } = await context.params;
    const denied = await authorize(tenantId);
    if (denied) return denied;

    const backend = await getTenantBackend(tenantId);

    const searchParams = request.nextUrl.searchParams;
    const table = searchParams.get("table");
    const rowId = searchParams.get("rowId");

    const validationError = validateTable(backend.templateType, table);
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

    if (backend.kind === "pocketbase") {
      const record = await backend.client.update(table!, rowId, body);
      return NextResponse.json({
        data: pbToRow(record as Record<string, unknown>),
      });
    }

    const { data, error } = await backend.client
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
    const { id: tenantId } = await context.params;
    const denied = await authorize(tenantId);
    if (denied) return denied;

    const backend = await getTenantBackend(tenantId);

    const searchParams = request.nextUrl.searchParams;
    const table = searchParams.get("table");
    const rowId = searchParams.get("rowId");

    const validationError = validateTable(backend.templateType, table);
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

    if (backend.kind === "pocketbase") {
      await backend.client.remove(table!, rowId);
      return NextResponse.json({ success: true });
    }

    const { error } = await backend.client
      .from(table!)
      .delete()
      .eq("id", rowId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
