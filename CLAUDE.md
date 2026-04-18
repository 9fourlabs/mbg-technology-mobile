# MBG Technology Mobile — Working Notes

## What this is

A multi-tenant mobile-app platform owned by **MBG Technology**, built and operated by **9fourlabs** (`tbrown@9fourlabs.com`). Two halves in one repo:

- **Mobile app** (root, Expo SDK 55 / RN 0.83 / React 19.2) — a template engine. Each tenant is one JSON config in `configs/tenants/`; shared TS code in `src/` renders it. Eight template types: `informational`, `authenticated`, `booking`, `commerce`, `loyalty`, `content`, `forms`, `directory` — plus the `custom` path where a client's own Expo repo is plugged into the same build/preview pipeline.
- **Admin portal** (`admin/`, Next.js 16 + React 19 + Preline UI) — runs on Fly.io. MBG admins manage tenants here; client users log in at `/client/login` and only see their own tenant. Connects to per-tenant Supabase projects for content via service-role.

The architecture is **per-tenant Supabase projects** for content/auth (one project per client app), plus a **central admin Supabase project** (`mbg-admin`, ref `wmckytfxlcxzhzduttvv`) for cross-tenant infra (`tenants`, `builds`, `tenant_users`, `push_tokens`, `analytics_events`, `activity_log`).

> ⚠️ The `admin/` Next.js version has breaking changes from training data — see `admin/AGENTS.md`. Read `admin/node_modules/next/dist/docs/` before writing anything Next-version-sensitive.

---

## Where Claude left off (2026-04-18)

Just finished a 10-workstream push that rebuilt the platform around four pillars: **publishable** (App Store + Play Store), **iterable** (OTA updates in seconds), **client-operable** (separate portal, content management, push notifications), and **observable** (per-tenant analytics).

Everything in [docs/SETUP.md](docs/SETUP.md) — that's the operational checklist. Specific docs:
- [docs/OTA_UPDATES.md](docs/OTA_UPDATES.md) — fast-path content iteration
- [docs/STORE_SUBMISSION.md](docs/STORE_SUBMISSION.md) — Apple + Google submit flow
- [docs/PUSH_NOTIFICATIONS.md](docs/PUSH_NOTIFICATIONS.md) — push setup, gated per-tenant
- [docs/KEYSTORE_SOP.md](docs/KEYSTORE_SOP.md) — Android signing

### Things that have already been done in the cloud (don't redo)

- Supabase migrations **010, 011, 015, 017, 018** applied to the admin DB.
- Your `tbrown@9fourlabs.com` user has `app_metadata.role = "admin"`.
- The Android upload keystore (`keystores/mbg-upload.jks`) has been regenerated with a known password — see `keystores/CREDENTIALS.md` (gitignored, copy from old laptop or 1Password).

### Things to do *immediately* on the new laptop

1. **Rotate the admin Supabase DB password** — was pasted in chat during the last session. Supabase dashboard → Settings → Database → Reset database password.
2. **Revoke the personal access token** `sbp_f7f8a6988074c0b848da594f9e3f107b533e32a7` at https://supabase.com/dashboard/account/tokens.
3. **Sign out and back in to the admin portal** so your JWT picks up the new admin role claim. Without this, the new RLS policies will treat you as a non-admin.

### Things still genuinely needing you (cannot be automated)

Walk through [docs/SETUP.md](docs/SETUP.md) sections **A** (one-time) and **B** (per tenant). Summary:

- **A1** Apple Developer: ASC API key (.p8), Apple Team ID, Apple Push Key (.p8), upload to EAS, GitHub secret `APPLE_TEAM_ID`.
- **A2** Google: Play service account JSON, FCM service account JSON, upload to EAS.
- **A3** GitHub repo secrets: `EXPO_TOKEN`, `APPLE_TEAM_ID`, `ADMIN_URL`, `ADMIN_BUILD_LINK_SECRET`.
- **B** For each client tenant going to production: Expo project, App Store Connect app + numeric Apple ID, Play Console listing + service account upload, and (if push) regenerated iOS provisioning profile with push entitlement.

### When the first tenant Supabase project is provisioned

Apply the per-tenant migrations (`001_content.sql` through `009_*` plus `016_events.sql`) to that project. I used the Supabase Management API to apply admin-DB migrations last session — same pattern works for tenant projects:

```bash
PROJECT_REF=<tenant-supabase-ref>
TOKEN=<your-fresh-PAT>
for f in supabase/migrations/00{1,2,3,4,5,6,7,8,9}_*.sql supabase/migrations/016_events.sql; do
  echo "=== $f ==="
  jq -n --arg q "$(cat "$f")" '{query: $q}' \
    | curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
        -d @- "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query"
done
```

---

## New-laptop setup

### Prerequisites

- Node.js 20+
- npm
- Xcode (for iOS local builds — optional, EAS handles cloud builds)
- Android Studio (for Android local emulator — optional)
- Docker Desktop (only if you want local Supabase via `supabase start`)
- `gh` CLI authenticated to GitHub (`gh auth login`)
- `eas` CLI: `npm i -g eas-cli` then `eas login`
- Supabase CLI (optional): download from https://github.com/supabase/cli/releases

### Get the code

```bash
git clone https://github.com/9fourlabs/mbg-technology-mobile.git
cd mbg-technology-mobile
npm install
cd admin && npm install && cd ..
```

### Files NOT in the repo (copy from old laptop or restore from vault)

| Path | What | Where to get it |
|------|------|-----------------|
| `keystores/mbg-upload.jks` | Android upload keystore | 1Password under `mbg-mobile/mbg/android-keystore` |
| `keystores/CREDENTIALS.md` | Plaintext keystore password reference | 1Password (re-create from password) |
| `admin/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_TOKEN`, `GITHUB_REPO`, `ADMIN_BUILD_LINK_SECRET` | See `admin/.env.local.example`; values from Supabase + GitHub dashboards |

### Run locally

```bash
# Mobile (default tenant: mbg)
npm run start
# Or pick a tenant:
APP_TENANT=acme-anvil npm run start

# Admin (separate terminal)
cd admin && npm run dev   # http://localhost:3000
```

### Common workflows

| What | Command |
|------|---------|
| Regenerate JSON tenant configs from TS sources | `npm run build:tenants` |
| Add a new tenant scaffold | `npm run new-tenant` |
| Validate all tenants | `npm run validate:tenants` |
| Validate a tenant for production release | `npm run validate:production -- <tenant>` |
| Generate an Android keystore for a tenant | `npm run generate:keystore -- <tenant>` |
| Publish an OTA update (preview) | `npm run ota:preview -- --tenant <t> --message "..."` |
| Publish an OTA update (production) | `npm run ota:production -- --tenant <t> --message "..."` |
| Trigger a preview build | Via admin UI → Tenant → Builds → Preview, or GitHub Actions → "EAS Preview Builds" → Run workflow |
| Trigger a production submission | Via admin UI → Tenant → Builds → Production, or GitHub Actions → "EAS Promote to Production" |
| TypeScript check (mobile) | `npx tsc --noEmit` |
| TypeScript check (admin) | `cd admin && npx tsc --noEmit` |
| Build admin (catches most issues) | `cd admin && npm run build` |

### Pre-existing TS errors (not yours)

There's one pre-existing nullability error at `src/hooks/useAnalytics.ts:24` that predated this batch of work. Safe to leave for now or fix as a quick chore.

---

## Architecture cheat sheet

```
┌─────────────────────┐         ┌─────────────────────┐
│  Mobile app         │ HTTPS   │  Admin Next.js app  │
│  (Expo SDK 55)      │────────▶│  (Fly.io)           │
│                     │         │                     │
│  reads tenant JSON  │         │  /            MBG  │
│  via APP_TENANT     │         │  /client      Client│
└──────────┬──────────┘         └──────────┬──────────┘
           │                               │
           │ tenant's Supabase             │ admin Supabase
           │ (per-tenant project)          │ (mbg-admin: tenants,
           │ posts/events/bookings/etc     │  builds, tenant_users,
           ▼                               │  push_tokens,
   ┌──────────────────┐                    │  analytics_events)
   │ Tenant Supabase  │◀──── service-role ─┘
   │ (one per tenant) │      from admin API routes
   └──────────────────┘
```

- **Channels for OTA**: preview builds use `preview-<tenant>` (shared Expo project across tenants); production builds use `production` (per-tenant Expo project).
- **Native ID modes**: preview Android uses tenant-isolated package, preview iOS uses shared bundle ID (provisioning profile constraint), production uses per-tenant on both.
- **Auth**: admin DB is the single auth surface; `app_metadata.role = "admin"` (fast path, in JWT) or row in `tenant_users` with `role='admin'` (slow path, DB query) marks an MBG admin. Anything else is a client and only sees tenants in `tenant_users` for their `user_id`.

---

## Git conventions

- Direct commits to `main` are the norm in recent history (with occasional PRs from the admin-managed tenant flow).
- Commit messages start with a verb: `Add ...`, `Fix ...`, `Wire ...`. See `git log --oneline -20` for style.
- Co-author footer on Claude commits: `Co-Authored-By: Claude ...` (the harness adds this).

## Repository layout (the bits worth knowing)

```
.
├── app.config.ts                 # Expo config — tenant-aware, OTA-wired
├── eas.json                      # Build/submit profiles, channels
├── index.ts                      # Mobile entry (loads templates)
├── src/
│   ├── TemplateApp.tsx           # Top-level renderer
│   ├── *TemplateApp.tsx          # One per template type
│   ├── auth/                     # Supabase client per tenant project
│   ├── components/               # Shared UI
│   ├── hooks/                    # usePushNotifications, useAnalytics
│   └── templates/                # Type definitions + per-template renderers
├── configs/
│   ├── tenants-src/<t>.ts        # Authored TS configs
│   └── tenants/<t>.json          # Compiled JSON (build:tenants)
├── scripts/                      # Build, validate, OTA, keystore helpers
├── supabase/migrations/          # Mixed: admin-DB and per-tenant-DB SQL
├── docs/                         # SOPs (READ THESE FIRST)
├── admin/                        # Next.js admin portal
│   └── src/
│       ├── proxy.ts              # Route-level auth (was middleware.ts pre-Next-16)
│       ├── app/
│       │   ├── (auth)/           # MBG-admin routes (sidebar layout)
│       │   ├── client/           # Client portal (separate layout)
│       │   ├── api/              # Routes — tenant content proxy, notifications, etc.
│       │   └── login/            # Admin login
│       └── lib/
│           ├── auth/user-context.ts  # Role + tenant resolution
│           ├── supabase/             # server, client, admin (service-role), tenant
│           └── content-schemas.ts    # Drives the generic content CRUD UI
└── .eas/workflows/               # EAS workflows (preview/release/ota)
└── .github/workflows/            # GitHub Actions wrappers around EAS workflows
```
