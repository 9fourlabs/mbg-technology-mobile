# Pocketbase Migration Plan

## Why

Supabase per-tenant projects at $25/project/month compound linearly with tenant
count. At 20 tenants that's $500/mo; at 100 it's $2,500. The architecture we
actually wanted — "sealed per-tenant sandbox, isolated auth realm, isolated
data, dedicated machine" — is what Pocketbase-per-Fly-instance gives us natively.
Same or better isolation story, ~10-20× lower cost at scale.

## Architecture (target)

```
┌───────────────────────────────┐   ┌─────────────────────────────────┐
│ Admin portal + MBG infra      │   │ Per-tenant Pocketbase instances │
│ (Fly org: 9four-labs)         │   │ (Fly org: FLY_TENANTS_ORG)      │
│                               │   │                                 │
│ Supabase: mbg-admin           │   │ mbg-pb-<tenant> (one Fly app    │
│   tenants                     │──▶│   per tenant, auto-stop, $2-5/mo│
│   builds                      │   │   per tenant when active, $0    │
│   tenant_users                │   │   when idle)                    │
│   push_tokens                 │   │                                 │
│   analytics_events            │   │ Stack per instance: one Go      │
│   activity_log                │   │ binary (Pocketbase), one SQLite │
│                               │   │ DB, one volume for storage +    │
│ Still on Supabase — central   │   │ uploads.                        │
│ infra, not per-tenant data.   │   │                                 │
└───────────────────────────────┘   └─────────────────────────────────┘
```

**Admin DB stays on Supabase.** It holds cross-tenant infra — `tenants` registry,
`builds`, MBG staff auth, `tenant_users` membership, analytics aggregates, push
token registry. Small, central, doesn't scale with tenant count.

**Per-tenant data moves to its own Pocketbase instance on Fly.** Each template
type's schema (content/booking/commerce/loyalty/forms/directory) lands as a set
of Pocketbase collections. End-user auth for the mobile app moves to that
tenant's PB instance.

## Org separation

Per-tenant PB apps live in a **separate Fly org — "MBG" (slug `mbg-989`)**,
already created. Admin portal stays on `9four-labs`. This gives:

- Billing isolation — easy to see "tenants cost us $X/mo"
- Blast radius — no cross-org destructive accidents
- Org-scoped API tokens so admin portal can only provision/destroy in tenant org

Admin portal needs these env vars (Phase 1 unblocker):

- `FLY_TENANTS_ORG=mbg-989` — tenant org slug
- `FLY_TENANTS_API_TOKEN` — org-scoped Fly API token. Create with
  `flyctl tokens create org mbg-989 --name "admin-portal-provisioner"` and
  store in 1Password at `op://MBG/Fly MBG Org Token/credential`. Wire into
  admin Fly secrets via the standard `fly secrets import` pipeline.
- `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` — seed values for the initial PB
  admin account per instance (same credentials across all instances so a
  single admin token suffices). Store in 1Password.

## Phases

### Phase 0 — Scaffolding (this PR)

- [x] Branch `claude/pocketbase-migration`
- [x] Migration plan doc
- [x] `infra/pocketbase/` — Dockerfile + fly.toml template for a PB instance
- [x] `infra/pocketbase/schemas/` — Pocketbase collection definitions per template type
- [x] Admin DB migration 020 — add `pocketbase_url`, `pocketbase_app_name` to `tenants`
- [x] `admin/src/lib/pocketbase/` — client + types + provisioning helper (stubbed)
- [x] `scripts/provisionPocketbase.ts` — CLI wrapper for manual provisioning / testing

### Phase 1 — Pilot (one tenant, content template only)

- [ ] Create `FLY_TENANTS_ORG` in Fly dashboard + org-scoped API token
- [ ] Provision one PB instance for `mbg` tenant (content template)
- [ ] Seed PB collections from `infra/pocketbase/schemas/content.json`
- [ ] Wire admin portal Content tab to read/write from tenant PB instead of Supabase (feature-flag on tenant row)
- [ ] Mobile app: abstract content queries behind `getTenantBackend()` that routes to PB for flagged tenants, Supabase otherwise
- [ ] Verify end-to-end: create a post in admin → mobile app shows it
- [ ] Measure: DX, latency, cold-start time after auto-stop

**Checkpoint gate:** If DX + perf look good, commit to full migration. If not, tear down the PB instance and keep Supabase.

### Phase 2 — All templates, new-tenant-default

- [ ] Port all template schemas (content, booking, commerce, loyalty, forms, directory, events) to PB collection JSON
- [ ] `provisionPocketbaseTenant()` becomes the default on new-tenant creation (replaces the never-called `createProject()`)
- [ ] Admin portal content CRUD routes (`/api/tenants/[id]/content`) use PB client
- [ ] Mobile app: all per-template data queries go through the backend abstraction

### Phase 3 — End-user auth migration

- [ ] Replace tenant end-user Supabase auth with PB auth
- [ ] Mobile app: login/signup flows talk to tenant's PB instance
- [ ] One-time migration: export auth.users from current Supabase, import as PB users (pilot tenant only first)

### Phase 4 — Cutover existing tenants + cleanup

- [ ] For each existing tenant: provision PB instance, export data from Supabase, import to PB, flip the feature flag, verify, deprovision Supabase side
- [ ] Remove `admin/src/lib/supabase/tenant.ts` (unused once all tenants on PB)
- [ ] Update CLAUDE.md to reflect PB architecture as current (not aspirational)
- [ ] Write PB backup/restore SOP (`docs/POCKETBASE_OPS.md`) — litestream to S3, snapshot restores, disaster recovery

## Feature parity checklist

| Supabase feature we use | PB equivalent | Status |
|---|---|---|
| Postgres tables | SQLite collections | ✓ |
| Row-level security | Collection access rules (list/view/create/update/delete) | ✓ |
| Auth (email/pw, OAuth) | Built-in auth with OAuth providers | ✓ |
| Storage (file uploads) | Built-in `files` field type + disk or S3 backend | ✓ |
| Realtime (subscribe to table changes) | Realtime via SSE | ✓ (different API) |
| Service-role client (bypass RLS) | PB admin API token | ✓ |
| Management API (provision projects) | `fly apps create` + volume + deploy | ✓ (more work, less magic) |
| pgvector / full-text search | SQLite FTS (built-in) | ✓ for keyword search; no vector |
| Edge Functions | `pb_hooks` (JS hooks) | Less rich, workable for our use |
| Dashboard | PB admin UI per instance | Different workflow — one dashboard per tenant |

**Things we don't currently use from Supabase** (so not a blocker): edge
functions, pgvector, realtime (we poll), full-text search at scale.

## Rollback strategy

The migration is **gated per tenant via a feature flag** on the `tenants` row
(`backend = 'supabase' | 'pocketbase'`). Any tenant can be rolled back to
Supabase by flipping the flag and re-importing data. During Phase 2-4, both
backends coexist — the mobile app and admin portal route based on the flag.

The only irreversible step is Phase 4's "remove Supabase tenant code paths,"
which happens after every tenant is successfully on PB and stable.

## Open questions

1. **PB admin token storage** — we need one per instance. Store in admin DB
   encrypted with app key? Or use Fly secrets per app (harder to read back)?
2. **Backups** — litestream replicating SQLite → S3/B2? Fly volume snapshots?
   Both?
3. **Monitoring** — Fly has basic machine-level metrics. Do we need app-level
   per-tenant dashboards? Probably yes at scale.
4. **Migration script for existing tenants** — automated or hand-run? Given
   we have ~5 tenants, hand-run is fine for v1.
