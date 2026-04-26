import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  loyalty: ["loyalty_rewards", "loyalty_transactions", "loyalty_accounts"],
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

interface TenantBackend {
  client: PocketbaseClient;
  templateType: string;
}

/**
 * Returns a Pocketbase client for the tenant's per-tenant data instance.
 * Tenants on the legacy `backend='supabase'` flag are rejected — those
 * tenants need to be migrated via `scripts/provisionPocketbase.ts --tenant
 * <slug> --template <type>` first. The only non-PB tenant in active use
 * today is MBG (informational), and informational tenants have no content
 * tables, so the route is never called for them.
 */
async function getTenantBackend(tenantId: string): Promise<TenantBackend> {
  const supabase = await createClient();
  const { data: tenant } = await supabase
    .from("tenants")
    .select("template_type, backend, pocketbase_url")
    .eq("id", tenantId)
    .single();

  if (!tenant) throw new Error("Tenant not found");

  if (tenant.backend !== "pocketbase") {
    throw new Error(
      `Tenant "${tenantId}" is on legacy backend "${tenant.backend}". ` +
        `Migrate to Pocketbase first: ` +
        `scripts/provisionPocketbase.ts --tenant ${tenantId} --template ${tenant.template_type}`,
    );
  }
  if (!tenant.pocketbase_url) {
    throw new Error(
      "Tenant has backend='pocketbase' but no pocketbase_url — provisioning incomplete",
    );
  }

  const adminPassword = process.env.PB_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error("PB_ADMIN_PASSWORD must be set");
  }

  return {
    client: new PocketbaseClient({
      url: tenant.pocketbase_url,
      adminEmail: PB_ADMIN_EMAIL,
      adminPassword,
    }),
    templateType: tenant.template_type,
  };
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
  return null;
}

/** PB system fields → Supabase-shaped row aliases. */
function pbToRow(record: Record<string, unknown>): Record<string, unknown> {
  return {
    ...record,
    created_at: record.created,
    updated_at: record.updated,
  };
}

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
    const record = await backend.client.create(table!, body);
    return NextResponse.json(
      { data: pbToRow(record as Record<string, unknown>) },
      { status: 201 },
    );
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
    const record = await backend.client.update(table!, rowId, body);
    return NextResponse.json({
      data: pbToRow(record as Record<string, unknown>),
    });
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

    await backend.client.remove(table!, rowId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
