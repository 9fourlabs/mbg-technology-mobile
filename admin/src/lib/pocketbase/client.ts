/**
 * Minimal Pocketbase REST client — no SDK dependency yet.
 *
 * We'll swap this for the official `pocketbase` npm package in Phase 1 once
 * we're sure the migration is committed. Until then, hand-rolled fetch keeps
 * the scaffolding commit dep-free and works in every Next.js runtime (Node,
 * Edge, server components).
 *
 * Only the subset we actually need is implemented:
 *   - admin auth (for server-side service-role-equivalent access)
 *   - list / get / create / update / delete records
 *
 * Full Pocketbase REST API reference: https://pocketbase.io/docs/api-records/
 */

export interface PocketbaseConfig {
  /** Base URL of the tenant's PB instance, e.g. https://mbg-pb-mbg.fly.dev */
  url: string;
  /**
   * Either a pre-obtained admin auth token (service-role equivalent) OR
   * admin email+password for server-side token minting.
   *
   * For the admin portal, we mint a token per request via `adminLogin()` and
   * cache it in memory. For scripts, pass a pre-minted token.
   */
  adminToken?: string;
  adminEmail?: string;
  adminPassword?: string;
}

export interface PocketbaseRecord {
  id: string;
  created: string;
  updated: string;
  [key: string]: unknown;
}

export interface ListResult<T = PocketbaseRecord> {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

export class PocketbaseError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message: string
  ) {
    super(message);
  }
}

export class PocketbaseClient {
  private token: string | null;

  constructor(private config: PocketbaseConfig) {
    this.token = config.adminToken ?? null;
  }

  /**
   * Exchange email+password for an admin auth token.
   * Required before any non-public operation unless `adminToken` was passed in.
   */
  async adminLogin(): Promise<void> {
    if (this.token) return;
    if (!this.config.adminEmail || !this.config.adminPassword) {
      throw new Error(
        "PocketbaseClient: either adminToken or adminEmail+adminPassword must be provided"
      );
    }
    const res = await this.raw("/api/admins/auth-with-password", {
      method: "POST",
      body: JSON.stringify({
        identity: this.config.adminEmail,
        password: this.config.adminPassword,
      }),
    });
    const body = (await res.json()) as { token: string };
    this.token = body.token;
  }

  async list<T = PocketbaseRecord>(
    collection: string,
    params: {
      page?: number;
      perPage?: number;
      filter?: string;
      sort?: string;
      expand?: string;
    } = {}
  ): Promise<ListResult<T>> {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.perPage) qs.set("perPage", String(params.perPage));
    if (params.filter) qs.set("filter", params.filter);
    if (params.sort) qs.set("sort", params.sort);
    if (params.expand) qs.set("expand", params.expand);
    const res = await this.authed(
      `/api/collections/${collection}/records?${qs.toString()}`
    );
    return (await res.json()) as ListResult<T>;
  }

  async get<T = PocketbaseRecord>(
    collection: string,
    id: string
  ): Promise<T> {
    const res = await this.authed(`/api/collections/${collection}/records/${id}`);
    return (await res.json()) as T;
  }

  async create<T = PocketbaseRecord>(
    collection: string,
    data: Record<string, unknown>
  ): Promise<T> {
    const res = await this.authed(`/api/collections/${collection}/records`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return (await res.json()) as T;
  }

  async update<T = PocketbaseRecord>(
    collection: string,
    id: string,
    data: Record<string, unknown>
  ): Promise<T> {
    const res = await this.authed(`/api/collections/${collection}/records/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return (await res.json()) as T;
  }

  async remove(collection: string, id: string): Promise<void> {
    await this.authed(`/api/collections/${collection}/records/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * Import an array of collection definitions — used by the provisioning
   * script to seed per-template schema into a fresh PB instance.
   * Accepts the JSON shape under `infra/pocketbase/schemas/*.json`.
   */
  async importCollections(collections: unknown[]): Promise<void> {
    await this.authed("/api/collections/import", {
      method: "PUT",
      body: JSON.stringify({ collections, deleteMissing: false }),
    });
  }

  /** Low-level — exposed for provisioning script edge cases. */
  private async authed(path: string, init: RequestInit = {}): Promise<Response> {
    if (!this.token) await this.adminLogin();
    return this.raw(path, {
      ...init,
      headers: {
        ...(init.headers ?? {}),
        Authorization: this.token ?? "",
      },
    });
  }

  private async raw(path: string, init: RequestInit = {}): Promise<Response> {
    const res = await fetch(`${this.config.url}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) {
      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        body = await res.text();
      }
      throw new PocketbaseError(
        res.status,
        body,
        `Pocketbase request failed: ${init.method ?? "GET"} ${path} → ${res.status}`
      );
    }
    return res;
  }
}
