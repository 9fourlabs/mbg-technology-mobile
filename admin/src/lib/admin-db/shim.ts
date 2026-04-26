/**
 * Supabase-API compatibility shim on top of Pocketbase.
 *
 * Goal: every existing call site that does `supabase.from('tenants').select().eq()`
 * keeps working without code changes. Internally, the query builder translates
 * each chained operation into PB REST calls + per-table column mappings.
 *
 * Per-table mapping rules:
 *   - `tenants.id` (slug, PK in Supabase) ↔ `tenants.slug` in PB
 *   - `builds.tenant_id` (FK) ↔ `builds.tenant` (PB relation; auto-resolves slug ↔ PB id)
 *   - `tenant_users.user_id` ↔ `tenant_users.user` (PB relation, by email lookup)
 *   - `tenant_users.tenant_id` ↔ `tenant_users.tenant` (PB relation)
 *   - `activity_log.tenant_id` ↔ `activity_log.tenant` (PB relation)
 *   - `push_tokens.*` and `analytics_events.*` — same field names, no translation
 *
 * Limitations (intentional):
 *   - No `.rpc()` (we don't use it)
 *   - No `.realtime` / `.channel` (we don't use it)
 *   - No `.storage` (use the existing Supabase client directly until storage migration)
 *   - No `like/ilike/is/contains` filters (we don't use them on admin tables)
 *
 * The shim is exported as `createCompatClient()` and aliased into the existing
 * `lib/supabase/server.ts` and `admin.ts` so all 35 callsites pick it up
 * automatically.
 */

import { adminPb } from "@/lib/pocketbase/admin-client";

/** PB client returned by `adminPb()` — duck-typed to avoid a circular import. */
type PbClient = Awaited<ReturnType<typeof adminPb>>;

interface RelationSpec {
  pbField: string;
  refTable: string;
  refColumn: string;
}

interface TableConfig {
  pbCollection: string;
  fieldMap?: Record<string, string>;
  relations?: Record<string, RelationSpec>;
  pkAlias?: { supabase: string; pb: string };
}

const TABLES: Record<string, TableConfig> = {
  tenants: {
    pbCollection: "tenants",
    fieldMap: { id: "slug" },
    pkAlias: { supabase: "id", pb: "slug" },
  },
  builds: {
    pbCollection: "builds",
    relations: {
      tenant_id: { pbField: "tenant", refTable: "tenants", refColumn: "slug" },
    },
  },
  tenant_users: {
    pbCollection: "tenant_users",
    relations: {
      user_id: { pbField: "user", refTable: "users", refColumn: "id" },
      tenant_id: { pbField: "tenant", refTable: "tenants", refColumn: "slug" },
    },
  },
  push_tokens: { pbCollection: "push_tokens" },
  analytics_events: { pbCollection: "analytics_events" },
  activity_log: {
    pbCollection: "activity_log",
    relations: {
      tenant_id: { pbField: "tenant", refTable: "tenants", refColumn: "slug" },
    },
  },
  users: { pbCollection: "users" },
};

type TableName = string;

interface Filter {
  type:
    | "eq"
    | "neq"
    | "in"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "is_null"
    | "is_not_null"
    | "ilike"
    | "raw_or";
  column: string;
  value: unknown;
}

interface OrderSpec {
  column: string;
  ascending: boolean;
}

type ResultEnvelope<T> = {
  data: T;
  error: { message: string; code?: string } | null;
  count?: number | null;
};

interface SelectOpts {
  count?: "exact" | "planned" | "estimated";
  head?: boolean;
}

const SLUG_FROM_PB_ID_CACHE = new Map<string, string>(); // pb-id → slug

/** Resolve a Supabase-shaped slug to its PB record id (cached). */
async function resolveSlugToPbId(
  pb: PbClient,
  refTable: TableName,
  refColumn: string,
  slug: string,
): Promise<string | null> {
  if (typeof slug !== "string" || !slug) return null;
  const cfg = TABLES[refTable];
  const result = await pb.list<Record<string, unknown>>(cfg.pbCollection, {
    filter: `${refColumn} = "${slug.replace(/"/g, '\\"')}"`,
    perPage: 1,
  });
  const pbId = result.items[0]?.id as string | undefined;
  if (pbId) {
    SLUG_FROM_PB_ID_CACHE.set(`${refTable}:${pbId}`, slug);
  }
  return pbId ?? null;
}

/** Get the slug for a PB record id, given the table. Used to project Supabase-shaped fields back. */
async function pbIdToSlug(
  pb: PbClient,
  refTable: TableName,
  refColumn: string,
  pbId: string,
): Promise<string | null> {
  const cached = SLUG_FROM_PB_ID_CACHE.get(`${refTable}:${pbId}`);
  if (cached) return cached;
  if (!pbId) return null;
  try {
    const record = await pb.get<Record<string, unknown>>(
      TABLES[refTable].pbCollection,
      pbId,
    );
    const slug = record[refColumn] as string | undefined;
    if (slug) SLUG_FROM_PB_ID_CACHE.set(`${refTable}:${pbId}`, slug);
    return slug ?? null;
  } catch {
    return null;
  }
}

/** Build a PB filter expression from a list of Supabase-style filters. */
async function buildPbFilter(
  pb: PbClient,
  table: TableName,
  filters: Filter[],
): Promise<string> {
  const cfg = TABLES[table];
  const parts: string[] = [];
  for (const f of filters) {
    const pbField = cfg.relations?.[f.column]?.pbField
      ?? cfg.fieldMap?.[f.column]
      ?? f.column;

    let pbValue: unknown = f.value;
    // For relation columns, we need to translate slug → PB id.
    const rel = cfg.relations?.[f.column];
    if (rel) {
      if (Array.isArray(f.value)) {
        const ids = await Promise.all(
          f.value.map((v) =>
            resolveSlugToPbId(pb, rel.refTable, rel.refColumn, String(v)),
          ),
        );
        pbValue = ids.filter((x): x is string => Boolean(x));
      } else {
        pbValue = await resolveSlugToPbId(
          pb,
          rel.refTable,
          rel.refColumn,
          String(f.value),
        );
      }
    }

    if (f.type === "eq") {
      parts.push(`${pbField} = "${escapeFilter(pbValue)}"`);
    } else if (f.type === "neq") {
      parts.push(`${pbField} != "${escapeFilter(pbValue)}"`);
    } else if (f.type === "in") {
      const arr = Array.isArray(pbValue) ? pbValue : [];
      if (arr.length === 0) {
        parts.push("1 = 0");
      } else {
        const ors = arr
          .map((v) => `${pbField} = "${escapeFilter(v)}"`)
          .join(" || ");
        parts.push(`(${ors})`);
      }
    } else if (f.type === "gt") {
      parts.push(`${pbField} > "${escapeFilter(pbValue)}"`);
    } else if (f.type === "gte") {
      parts.push(`${pbField} >= "${escapeFilter(pbValue)}"`);
    } else if (f.type === "lt") {
      parts.push(`${pbField} < "${escapeFilter(pbValue)}"`);
    } else if (f.type === "lte") {
      parts.push(`${pbField} <= "${escapeFilter(pbValue)}"`);
    } else if (f.type === "is_null") {
      parts.push(`(${pbField} = null || ${pbField} = "")`);
    } else if (f.type === "is_not_null") {
      parts.push(`(${pbField} != null && ${pbField} != "")`);
    } else if (f.type === "ilike") {
      // PB's `~` operator is case-insensitive partial match.
      const pattern = String(pbValue).replace(/%/g, "");
      parts.push(`${pbField} ~ "${escapeFilter(pattern)}"`);
    } else if (f.type === "raw_or") {
      parts.push(translateOrFilter(table, String(f.value)));
    }
  }
  return parts.join(" && ");
}

/**
 * Translate Supabase's comma-separated `or()` filter string to PB syntax.
 * E.g. `id.ilike.%foo%,business_name.ilike.%foo%` →
 *      `(slug ~ "foo" || business_name ~ "foo")`
 */
function translateOrFilter(table: TableName, expr: string): string {
  const cfg = TABLES[table];
  const clauses = expr.split(",").map((c) => c.trim()).filter(Boolean);
  const pbClauses = clauses.map((clause) => {
    const m = clause.match(/^([^.]+)\.([^.]+)\.(.*)$/);
    if (!m) return "1 = 0";
    const [, col, op, rawVal] = m;
    const pbField = cfg.fieldMap?.[col] ?? cfg.relations?.[col]?.pbField ?? col;
    if (op === "eq") {
      return `${pbField} = "${escapeFilter(rawVal)}"`;
    }
    if (op === "ilike") {
      const pattern = rawVal.replace(/%/g, "");
      return `${pbField} ~ "${escapeFilter(pattern)}"`;
    }
    return "1 = 0";
  });
  return `(${pbClauses.join(" || ")})`;
}

function escapeFilter(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).replace(/"/g, '\\"');
}

/** Project a PB record back to a Supabase-shaped row (rename relation fields, alias `created` → `created_at`, etc.). */
async function pbToSupabaseRow(
  pb: PbClient,
  table: TableName,
  record: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const cfg = TABLES[table];
  const out: Record<string, unknown> = { ...record };

  // PK alias: tenants.id (slug) → output `id` field aliased from `slug`
  if (cfg.pkAlias) {
    out[cfg.pkAlias.supabase] = record[cfg.pkAlias.pb];
  }

  // Relations: project each PB-relation field to the Supabase FK-by-slug name.
  if (cfg.relations) {
    for (const [supColumn, rel] of Object.entries(cfg.relations)) {
      const pbId = record[rel.pbField] as string | undefined;
      if (pbId) {
        // Prefer expand if present, else lookup.
        const expand = (record.expand as Record<string, unknown> | undefined) ?? {};
        const expanded = expand[rel.pbField] as
          | Record<string, unknown>
          | undefined;
        if (expanded?.[rel.refColumn]) {
          out[supColumn] = expanded[rel.refColumn];
        } else {
          const slug = await pbIdToSlug(pb, rel.refTable, rel.refColumn, pbId);
          out[supColumn] = slug;
        }
        delete out[rel.pbField]; // remove the PB-internal field
      }
    }
  }

  // Always copy created/updated to created_at/updated_at for code that
  // expects Supabase-shaped timestamp names.
  if (record.created) out.created_at = record.created;
  if (record.updated) out.updated_at = record.updated;

  // Drop PB-internal sundries.
  delete out.expand;
  delete out.collectionId;
  delete out.collectionName;

  return out;
}

/**
 * Translate a Supabase-shaped insert/update payload to a PB-shaped one:
 *   - rename FK columns to PB relation fields, looking up the relation's pk
 *   - rename pkAlias's supabase field to PB field (slug for tenants)
 */
async function supabaseToPbPayload(
  pb: PbClient,
  table: TableName,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const cfg = TABLES[table];
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (cfg.pkAlias && key === cfg.pkAlias.supabase) {
      out[cfg.pkAlias.pb] = value;
      continue;
    }
    const rel = cfg.relations?.[key];
    if (rel) {
      if (value === null || value === undefined) {
        out[rel.pbField] = null;
        continue;
      }
      const pbId = await resolveSlugToPbId(
        pb,
        rel.refTable,
        rel.refColumn,
        String(value),
      );
      out[rel.pbField] = pbId;
      continue;
    }
    out[key] = value;
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class QueryBuilder<T = any> implements PromiseLike<ResultEnvelope<T[] | null>> {
  private operation: "select" | "insert" | "update" | "delete" | null = null;
  private selectOpts: SelectOpts = {};
  private filters: Filter[] = [];
  private orderSpec: OrderSpec | null = null;
  private limitN: number | null = null;
  private rangeStart: number | null = null;
  private rangeEnd: number | null = null;
  private payload: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private returnSelected = false;
  private upsertOpts: { onConflict?: string } | null = null;

  constructor(private readonly table: TableName) {}

  // ── Operation starters ─────────────────────────────────────────────────
  select(_columns?: string, opts?: SelectOpts): this {
    if (this.operation === null) this.operation = "select";
    this.selectOpts = opts ?? {};
    if (this.operation !== "select") this.returnSelected = true;
    return this;
  }
  insert(data: Record<string, unknown> | Record<string, unknown>[]): this {
    this.operation = "insert";
    this.payload = data;
    return this;
  }
  upsert(data: Record<string, unknown> | Record<string, unknown>[], opts?: { onConflict?: string }): this {
    this.operation = "insert";
    this.payload = data;
    this.upsertOpts = opts ?? {};
    return this;
  }
  update(data: Record<string, unknown>): this {
    this.operation = "update";
    this.payload = data;
    return this;
  }
  delete(): this {
    this.operation = "delete";
    return this;
  }

  // ── Filters ────────────────────────────────────────────────────────────
  eq(column: string, value: unknown): this {
    this.filters.push({ type: "eq", column, value });
    return this;
  }
  neq(column: string, value: unknown): this {
    this.filters.push({ type: "neq", column, value });
    return this;
  }
  in(column: string, values: unknown[]): this {
    this.filters.push({ type: "in", column, value: values });
    return this;
  }
  gt(column: string, value: unknown): this {
    this.filters.push({ type: "gt", column, value });
    return this;
  }
  gte(column: string, value: unknown): this {
    this.filters.push({ type: "gte", column, value });
    return this;
  }
  lt(column: string, value: unknown): this {
    this.filters.push({ type: "lt", column, value });
    return this;
  }
  lte(column: string, value: unknown): this {
    this.filters.push({ type: "lte", column, value });
    return this;
  }
  /**
   * Supabase `.not(column, 'is', null)` — only the `is null` case is
   * supported (it's the only one used in this codebase).
   */
  not(column: string, op: string, value: unknown): this {
    if (op === "is" && value === null) {
      this.filters.push({ type: "is_not_null", column, value: null });
    } else if (op === "eq") {
      this.filters.push({ type: "neq", column, value });
    } else {
      throw new Error(
        `admin-db shim: .not("${column}", "${op}", ...) not yet supported`,
      );
    }
    return this;
  }
  ilike(column: string, pattern: string): this {
    this.filters.push({ type: "ilike", column, value: pattern });
    return this;
  }
  /**
   * Supabase `.or('a.eq.x,b.ilike.%y%')` — comma-separated list of
   * `column.op.value` clauses combined with OR. Translated to PB filter
   * syntax. Only `eq` and `ilike` ops are translated today.
   */
  or(filterStr: string): this {
    this.filters.push({ type: "raw_or", column: "", value: filterStr });
    return this;
  }

  // ── Modifiers ──────────────────────────────────────────────────────────
  order(column: string, opts?: { ascending?: boolean }): this {
    this.orderSpec = { column, ascending: opts?.ascending ?? true };
    return this;
  }
  limit(n: number): this {
    this.limitN = n;
    return this;
  }
  range(start: number, end: number): this {
    this.rangeStart = start;
    this.rangeEnd = end;
    return this;
  }

  // ── Terminators ────────────────────────────────────────────────────────
  async single<U = T>(): Promise<ResultEnvelope<U | null>> {
    const result = await this.execute<U[]>();
    if (result.error) return { data: null, error: result.error };
    const items = result.data ?? [];
    if (items.length !== 1) {
      return {
        data: null,
        error: {
          message: `Expected exactly 1 row, got ${items.length}`,
          code: items.length === 0 ? "PGRST116" : "PGRST117",
        },
      };
    }
    return { data: items[0], error: null };
  }
  async maybeSingle<U = T>(): Promise<ResultEnvelope<U | null>> {
    const result = await this.execute<U[]>();
    if (result.error) return { data: null, error: result.error };
    const items = result.data ?? [];
    return { data: items[0] ?? null, error: null };
  }

  // PromiseLike — `await query` resolves with the array result.
  then<TResult1 = ResultEnvelope<T[] | null>, TResult2 = never>(
    onfulfilled?: ((value: ResultEnvelope<T[] | null>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute<T[]>().then(onfulfilled, onrejected);
  }

  // ── Internal: actually run the query against PB ────────────────────────
  private async execute<R>(): Promise<ResultEnvelope<R>> {
    try {
      const pb = await adminPb();
      const cfg = TABLES[this.table];

      if (this.operation === "insert") {
        const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
        const created: Record<string, unknown>[] = [];
        for (const row of rows) {
          const pbPayload = await supabaseToPbPayload(pb, this.table, row ?? {});
          // Upsert handling: if onConflict columns are provided and a matching
          // record exists, update instead of create.
          if (this.upsertOpts?.onConflict) {
            const conflictCols = this.upsertOpts.onConflict
              .split(",")
              .map((s) => s.trim());
            const conflictFilter = await buildPbFilter(
              pb,
              this.table,
              conflictCols.map((c) => ({
                type: "eq" as const,
                column: c,
                value: (row as Record<string, unknown>)[c],
              })),
            );
            const existing = await pb.list(cfg.pbCollection, {
              filter: conflictFilter,
              perPage: 1,
            });
            if (existing.items[0]) {
              const updated = await pb.update(
                cfg.pbCollection,
                (existing.items[0] as { id: string }).id,
                pbPayload,
              );
              created.push(updated as Record<string, unknown>);
              continue;
            }
          }
          const result = await pb.create(cfg.pbCollection, pbPayload);
          created.push(result as Record<string, unknown>);
        }
        if (this.returnSelected || this.operation === "insert") {
          const projected = await Promise.all(
            created.map((r) => pbToSupabaseRow(pb, this.table, r)),
          );
          return { data: projected as unknown as R, error: null };
        }
        return { data: null as R, error: null };
      }

      if (this.operation === "update") {
        const filter = await buildPbFilter(pb, this.table, this.filters);
        const matches = await pb.list(cfg.pbCollection, { filter, perPage: 200 });
        const pbPayload = await supabaseToPbPayload(
          pb,
          this.table,
          this.payload as Record<string, unknown>,
        );
        const updated: Record<string, unknown>[] = [];
        for (const m of matches.items) {
          const result = await pb.update(
            cfg.pbCollection,
            (m as { id: string }).id,
            pbPayload,
          );
          updated.push(result as Record<string, unknown>);
        }
        if (this.returnSelected) {
          const projected = await Promise.all(
            updated.map((r) => pbToSupabaseRow(pb, this.table, r)),
          );
          return { data: projected as unknown as R, error: null };
        }
        return { data: null as R, error: null };
      }

      if (this.operation === "delete") {
        const filter = await buildPbFilter(pb, this.table, this.filters);
        const matches = await pb.list(cfg.pbCollection, { filter, perPage: 200 });
        for (const m of matches.items) {
          await pb.remove(cfg.pbCollection, (m as { id: string }).id);
        }
        return { data: null as R, error: null };
      }

      // SELECT
      const filter = await buildPbFilter(pb, this.table, this.filters);
      const sortField = this.orderSpec
        ? cfg.relations?.[this.orderSpec.column]?.pbField
          ?? cfg.fieldMap?.[this.orderSpec.column]
          ?? (this.orderSpec.column === "created_at"
            ? "created"
            : this.orderSpec.column === "updated_at"
              ? "updated"
              : this.orderSpec.column)
        : null;
      const sortStr = sortField
        ? `${this.orderSpec!.ascending ? "+" : "-"}${sortField}`
        : undefined;

      const expandFields = cfg.relations
        ? Object.values(cfg.relations).map((r) => r.pbField).join(",")
        : undefined;

      let perPage = 200;
      let page = 1;
      if (this.rangeStart !== null && this.rangeEnd !== null) {
        perPage = this.rangeEnd - this.rangeStart + 1;
        page = Math.floor(this.rangeStart / perPage) + 1;
      }
      if (this.limitN !== null) {
        perPage = Math.min(perPage, this.limitN);
      }

      const list = await pb.list(cfg.pbCollection, {
        filter: filter || undefined,
        sort: sortStr,
        expand: expandFields,
        page,
        perPage,
      });

      // For head: true count queries, return data: null and count.
      if (this.selectOpts.head && this.selectOpts.count) {
        return { data: null as R, error: null, count: list.totalItems };
      }

      const items = await Promise.all(
        list.items.map((r) =>
          pbToSupabaseRow(pb, this.table, r as Record<string, unknown>),
        ),
      );

      return {
        data: items as unknown as R,
        error: null,
        count: this.selectOpts.count ? list.totalItems : null,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return {
        data: null as R,
        error: { message },
      };
    }
  }
}

/** A minimal Supabase-API-compatible client backed by Pocketbase. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface CompatClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from<T = any>(table: string): QueryBuilder<T>;
}

export function createCompatClient(): CompatClient {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from<T = any>(table: string): QueryBuilder<T> {
      if (!(table in TABLES)) {
        throw new Error(
          `admin-db shim: table "${table}" is not registered. ` +
            `Add it to TABLES in admin/src/lib/admin-db/shim.ts if it should be on PB.`,
        );
      }
      return new QueryBuilder<T>(table as TableName);
    },
  };
}
