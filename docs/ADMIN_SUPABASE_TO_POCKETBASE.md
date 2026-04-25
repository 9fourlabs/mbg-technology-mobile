# Admin DB Migration: Supabase → Pocketbase

## Why

The per-tenant migration to Pocketbase ([POCKETBASE_MIGRATION.md](POCKETBASE_MIGRATION.md))
left the admin DB on Supabase. Reason at the time: cost pressure was zero
(admin DB sits on free tier; doesn't grow with tenant count) and auth flow
rewrite was non-trivial. This doc tracks the follow-up that finishes the job:
move the admin DB to Pocketbase too, eliminating the Supabase dependency
across the whole stack.

After this migration, MBG runs on three primary services: **Fly** (admin
portal + per-tenant PB instances + central admin PB instance), **Expo/EAS**
(builds + OTA), **Appetize** (web preview). Supabase is removed entirely.

## Architecture (target)

```
┌───────────────────────────────────┐   ┌─────────────────────────────────┐
│ Admin portal                       │   │ Per-tenant Pocketbase instances │
│ (Fly org: 9four-labs)              │   │ (Fly org: mbg-989)              │
│                                    │   │                                 │
│ ┌────────────────────────────────┐ │   │ mbg-pb-<tenant>.fly.dev         │
│ │ Central admin Pocketbase       │ │──▶│   per-tenant content + auth     │
│ │ mbg-pb-admin.fly.dev           │ │   │   (current state — unchanged)   │
│ │   - tenants                    │ │   │                                 │
│ │   - builds                     │ │   │                                 │
│ │   - tenant_users               │ │   │                                 │
│ │   - push_tokens                │ │   │                                 │
│ │   - analytics_events           │ │   │                                 │
│ │   - activity_log               │ │   │                                 │
│ │   - users (Supabase Auth →     │ │   │                                 │
│ │     PB built-in auth)          │ │   │                                 │
│ └────────────────────────────────┘ │   │                                 │
│                                    │   │                                 │
└───────────────────────────────────┘   └─────────────────────────────────┘
```

The central admin PB lives in the **9four-labs** Fly org (not `mbg-989`),
since it's MBG-internal infra, not per-tenant data. Same separation
rationale as today's `mbg-admin` Next.js app.

## Phases

### Phase A — Schema + provisioning (this PR)

- [x] Port 6 admin tables to PB collection JSON: [infra/pocketbase/schemas/admin.json](../infra/pocketbase/schemas/admin.json)
- [x] Single-source `PB_ADMIN_EMAIL` constant: [admin/src/lib/pocketbase/constants.ts](../admin/src/lib/pocketbase/constants.ts)
- [ ] Generalize `provisionPocketbase.ts` to support a central admin instance (not just per-tenant)
- [ ] Provision `mbg-pb-admin.fly.dev` + import `admin.json` schema
- [ ] Sanity-check: admin record CRUD via PB REST against the new instance

**Checkpoint gate:** PB admin instance live, all 6 collections present, admin
authenticatable end-to-end. No production traffic touching it yet.

### Phase B — Data layer dual-read (next session)

- [ ] Build `admin/src/lib/pocketbase/admin-client.ts` — server-side PB client
      with the same shape as `admin/src/lib/supabase/admin.ts` (typed
      record interfaces + service-role/admin-token bypass).
- [ ] Add a feature flag `ADMIN_BACKEND=supabase|pocketbase` (env var) on
      the admin portal. Read-only paths (`/api/tenants/list`, `/api/builds/list`)
      branch on it.
- [ ] In the Next.js code, abstract `getTenants()`, `getBuilds()`,
      `getTenantUsers()`, etc. behind a single `adminDb()` helper that
      dispatches by flag. Existing `supabase.ts` remains the default.
- [ ] Mirror Playwright tests under both flag values to confirm parity.

**Checkpoint gate:** Admin portal serves identical data from both backends
when the flag is flipped at runtime. No write paths use PB yet.

### Phase C — Auth migration (separate session)

The hardest phase. Replace Supabase Auth with PB's built-in auth.

- [ ] Provision PB `users` collection (PB ships this auto for any auth-enabled
      collection) on `mbg-pb-admin`.
- [ ] One-shot script: export `auth.users` from Supabase, import as PB users.
      Bcrypt password hashes are likely portable (PB also uses bcrypt) but
      verify; worst case, force password resets via email.
- [ ] Update `app_metadata.role='admin'` membership → first-class PB user
      field (`is_mbg_admin: bool`) or rely solely on `tenant_users` rows.
      **Recommend the latter** — drop the JWT fast-path entirely, query
      `tenant_users` on every request, cache short-lived in middleware.
- [ ] Rewrite admin login flows:
  - `admin/src/app/login/page.tsx` → call PB `/api/admins/auth-with-password` for staff, or `/api/collections/users/auth-with-password` for client users
  - `admin/src/app/client/login/page.tsx` → PB users auth
  - `admin/src/app/api/auth/sign-out/route.ts` → PB token revoke
  - `admin/src/proxy.ts` (route-level auth) → verify PB token instead of Supabase JWT
  - `admin/src/lib/auth/user-context.ts` → resolve role + tenant from PB
- [ ] Update Playwright `auth.setup.ts` to mint PB tokens (test users seeded
      directly into `mbg-pb-admin` via service-role).
- [ ] Update mobile app's admin-callback paths if any (push token register,
      analytics ingest) to use PB-backed admin API routes.

**Checkpoint gate:** All auth flows pass Playwright with `ADMIN_BACKEND=pocketbase`.
Two existing 1Password test users (`Playwright Admin`, `Playwright Client`)
authenticate. Sessions don't leak across tenants.

### Phase D — Write paths + cutover (separate session)

- [ ] Flip every admin write path to dispatch by `ADMIN_BACKEND`:
  - `/api/tenants/[id]/save-config` (just-hardened in 022)
  - `/api/tenants/[id]/trigger-build`
  - `/api/tenants/[id]/version`
  - `/api/tenants/[id]/analytics`
  - `/api/tenants/[id]/build-link` (HMAC-protected callback from GA)
  - `/api/tenants` (create)
  - `/api/notifications/*`
  - `/api/auth/*`
- [ ] Dual-write window: writes go to BOTH backends for ~1 week so we have
      a rollback path. Reads still come from Supabase (source of truth).
- [ ] One-shot data import: `scripts/migrateAdminDB.ts` — copies all
      Supabase data into PB. Reconcile any drift accumulated during dual-write.
- [ ] Verify in admin portal: all UI screens show the same data with
      `ADMIN_BACKEND=pocketbase`.
- [ ] Flip `ADMIN_BACKEND=pocketbase` as the default. Supabase becomes
      shadow/read-only.
- [ ] Watch a week of production traffic.

**Checkpoint gate:** Admin portal runs solely on PB for a week, no diffs
between backends, no rollbacks.

### Phase E — Remove Supabase (separate session)

- [ ] Delete `admin/src/lib/supabase/` entirely
- [ ] Delete `supabase/migrations/` (or move to archive)
- [ ] Remove all `NEXT_PUBLIC_SUPABASE_*` env vars from Fly secrets,
      `.env.local.tpl`, GH secrets, 1Password
- [ ] Drop Supabase package deps (`@supabase/ssr`, `@supabase/supabase-js`)
- [ ] Deprovision the `mbg-admin` Supabase project (final step — irreversible)
- [ ] Update CLAUDE.md, ROADMAP.md, docs/SETUP.md to reflect PB-only architecture
- [ ] Announce: "MBG platform now runs without Supabase"

## Schema mapping notes

PB v0.22 requires custom IDs to be **exactly 15 chars** or auto-generated.
Existing tenant IDs are slugs like `mbg`, `acme-dental` — too short. So we
let PB auto-generate IDs and add `slug` (unique, indexed) as the
human-readable identifier:

| Supabase column | PB equivalent | Notes |
|---|---|---|
| `tenants.id` (text, slug) | `tenants.slug` (unique text) | Indexed, regex-validated |
| `tenants.created_at`/`updated_at` | PB built-in `created`/`updated` | Auto-managed |
| `builds.tenant_id` (FK text) | `builds.tenant` (PB relation) | Cascades on tenant delete |
| `tenant_users.user_id` (FK auth.users.id) | `tenant_users.user` (PB relation to `_pb_users_auth_`) | After Phase C |
| `analytics_events.tenant_id` (text, no FK) | `analytics_events.tenant_id` (text) | Kept loose — mobile writes use slug |
| `push_tokens.tenant_id` (text, no FK) | `push_tokens.tenant_id` (text) | Same |
| `activity_log.tenant_id` (FK text) | `activity_log.tenant` (PB relation) | Cascades |
| `auth.users` (Supabase Auth) | PB built-in `users` collection | Phase C migration |

## Rollback strategy

Phases A–B introduce zero production risk — the Supabase backend remains
authoritative until Phase D's flag flip. Phases C–D are gated by the
`ADMIN_BACKEND` env var; flipping back to `supabase` reverts in seconds.

The only irreversible step is **Phase E's deprovision of the Supabase
project**, which only happens after a full week of stable PB-only traffic.

## Open questions

1. **PB user ID format vs. existing Supabase user UUIDs.** Mobile app stores
   user IDs in some places. Do we need a mapping table during cutover, or
   force re-auth on first launch post-migration?
2. **Realtime / subscriptions.** Today the admin portal polls. PB has SSE
   realtime. If we want to upgrade UX (e.g., live build status), Phase B
   is the cleanest place to add it.
3. **Backups.** Per-tenant PB instances have no backup story yet. Adding
   one for the admin instance is mandatory — it's the source of truth.
   Litestream → S3/B2 is the consensus answer; do it in Phase A.
4. **Service-role analog.** Today admin API routes use `SUPABASE_SERVICE_ROLE_KEY`
   to bypass RLS. PB equivalent: the admin auth token from PB's admin auth.
   Cache it in memory in `admin-client.ts` with a 1h TTL.
