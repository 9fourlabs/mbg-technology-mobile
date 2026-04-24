/**
 * Mobile-side Pocketbase REST client — minimal subset for public reads.
 *
 * The mobile app reads per-tenant content (posts, directory items, events)
 * from a tenant's PB instance when its config sets `auth.backend = "pocketbase"`.
 * Mutations + bookmarks (user-scoped) wait for Phase 3 of the migration when
 * end-user auth itself moves to PB; until then they keep going to Supabase.
 *
 * Hand-rolled fetch (vs the official `pocketbase` SDK) keeps this dep-free
 * and works in React Native with no polyfills.
 */

export interface ListResult<T> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

export class PbError extends Error {
  constructor(public status: number, public body: unknown, message: string) {
    super(message);
  }
}

async function pbFetch(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new PbError(res.status, body, `Pocketbase ${path} → ${res.status}`);
  }
  return res;
}

export async function pbList<T>(
  baseUrl: string,
  collection: string,
  params: { filter?: string; sort?: string; perPage?: number; page?: number } = {},
): Promise<ListResult<T>> {
  const qs = new URLSearchParams();
  if (params.filter) qs.set("filter", params.filter);
  if (params.sort) qs.set("sort", params.sort);
  if (params.perPage) qs.set("perPage", String(params.perPage));
  if (params.page) qs.set("page", String(params.page));
  const res = await pbFetch(
    baseUrl,
    `/api/collections/${collection}/records?${qs.toString()}`,
  );
  return (await res.json()) as ListResult<T>;
}

export async function pbGet<T>(
  baseUrl: string,
  collection: string,
  id: string,
): Promise<T> {
  const res = await pbFetch(
    baseUrl,
    `/api/collections/${collection}/records/${id}`,
  );
  return (await res.json()) as T;
}
