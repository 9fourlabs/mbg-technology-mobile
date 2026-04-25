/**
 * Refine data provider that adapts our existing
 * `/api/tenants/[tenantId]/content` API to Refine's expected DataProvider
 * interface.
 *
 * Why this shape: the content API uses `?table=<resource>` query params and
 * `?rowId=<id>` rather than RESTful path segments. Refine's `simple-rest`
 * provider assumes pure REST (`/posts`, `/posts/:id`) — so we wrap it in a
 * thin custom provider that translates the URL shape while reusing all of
 * Refine's caching, mutation, and hooks.
 *
 * The API itself already handles auth (admin or tenant-owner) and dispatches
 * to the right per-tenant backend (Supabase or Pocketbase) based on
 * `tenant.backend`. This data provider doesn't care about backend choice.
 *
 * Usage: see `admin/src/components/cms/CmsRefineApp.tsx`.
 */

import type {
  DataProvider,
  CrudFilters,
  CrudSorting,
  Pagination,
} from "@refinedev/core";

interface BuildProviderOpts {
  tenantId: string;
}

interface RowResponse<T = Record<string, unknown>> {
  data: T;
}

interface ListResponse<T = Record<string, unknown>> {
  data: T[];
  count: number;
}

function urlFor(tenantId: string, table: string): string {
  return `/api/tenants/${encodeURIComponent(tenantId)}/content?table=${encodeURIComponent(table)}`;
}

function rowUrlFor(tenantId: string, table: string, rowId: string): string {
  return `${urlFor(tenantId, table)}&rowId=${encodeURIComponent(rowId)}`;
}

function applyPagination(url: string, pagination?: Pagination): string {
  if (!pagination) return url;
  const params = new URLSearchParams();
  if (pagination.currentPage) {
    params.set("page", String(pagination.currentPage));
  }
  if (pagination.pageSize) params.set("pageSize", String(pagination.pageSize));
  return params.toString() ? `${url}&${params.toString()}` : url;
}

function applySort(url: string, sorters?: CrudSorting): string {
  if (!sorters || sorters.length === 0) return url;
  const first = sorters[0];
  const params = new URLSearchParams();
  params.set("orderBy", first.field);
  params.set("ascending", first.order === "asc" ? "true" : "false");
  return `${url}&${params.toString()}`;
}

// CrudFilters → Server-side filtering isn't supported by the existing content
// API yet. For now, filters are ignored at the network layer and Refine's
// client-side filter primitives can take over for small datasets. Keep the
// param in the signature so we don't break callers when we add this later.
function applyFilters(url: string, _filters?: CrudFilters): string {
  return url;
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "same-origin",
  });
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    const msg =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export function buildTenantContentDataProvider({
  tenantId,
}: BuildProviderOpts): DataProvider {
  return {
    getApiUrl: () => `/api/tenants/${encodeURIComponent(tenantId)}/content`,

    getList: async ({ resource, pagination, sorters, filters }) => {
      let url = urlFor(tenantId, resource);
      url = applyPagination(url, pagination);
      url = applySort(url, sorters);
      url = applyFilters(url, filters);
      const body = await fetchJson<ListResponse>(url);
      return {
        data: body.data as never,
        total: body.count,
      };
    },

    getOne: async ({ resource, id }) => {
      // The list API returns one record when filtered by rowId via PUT/DELETE,
      // but GET doesn't take rowId. Fall back to fetching all + finding the
      // one — fine for a CMS UI where collections are small. For larger sets
      // this should grow into a proper /content/[rowId] route.
      const body = await fetchJson<ListResponse>(
        `${urlFor(tenantId, resource)}&pageSize=200`,
      );
      const record = (body.data as Array<Record<string, unknown>>).find(
        (r) => r.id === id,
      );
      if (!record) {
        throw new Error(`Record ${String(id)} not found in ${resource}`);
      }
      return { data: record as never };
    },

    create: async ({ resource, variables }) => {
      const body = await fetchJson<RowResponse>(urlFor(tenantId, resource), {
        method: "POST",
        body: JSON.stringify(variables),
      });
      return { data: body.data as never };
    },

    update: async ({ resource, id, variables }) => {
      const body = await fetchJson<RowResponse>(
        rowUrlFor(tenantId, resource, String(id)),
        { method: "PUT", body: JSON.stringify(variables) },
      );
      return { data: body.data as never };
    },

    deleteOne: async ({ resource, id }) => {
      await fetchJson(rowUrlFor(tenantId, resource, String(id)), {
        method: "DELETE",
      });
      return { data: { id } as never };
    },

    // Bulk + custom — leave as the default Refine no-ops for now.
    custom: async () => {
      throw new Error(
        "custom() is not implemented for tenant-content data provider",
      );
    },
  };
}
