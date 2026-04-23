# MBG Technology Mobile — Working Notes

## What this is

A multi-tenant mobile-app platform owned by **MBG Technology**, built and operated by **9fourlabs** (`tbrown@9fourlabs.com`). Two halves in one repo:

- **Mobile app** (root, Expo SDK 55 / RN 0.83 / React 19.2) — a template engine. Each tenant is one JSON config in `configs/tenants/`; shared TS code in `src/` renders it. Eight template types: `informational`, `authenticated`, `booking`, `commerce`, `loyalty`, `content`, `forms`, `directory` — plus the `custom` path where a client's own Expo repo is plugged into the same build/preview pipeline.
- **Admin portal** (`admin/`, Next.js 16 + React 19 + Preline UI) — runs on Fly.io at `mbg-admin.fly.dev`. MBG admins manage tenants here; client users log in at `/client/login` and only see their own tenant. Connects to per-tenant Supabase projects for content via service-role.

The architecture is **per-tenant Supabase projects** for content/auth (one project per client app), plus a **central admin Supabase project** (`mbg-admin`, ref `wmckytfxlcxzhzduttvv`) for cross-tenant infra (`tenants`, `builds`, `tenant_users`, `push_tokens`, `analytics_events`, `activity_log`).

Top-level docs for humans, by audience:

- **Leadership / sales / new-consultant intake** — [CONSULTANT_DEMO.md](./CONSULTANT_DEMO.md) at repo root.
- **Engineering (you)** — this file plus [docs/](./docs/) SOPs.
- **Consultants using the portal** — https://mbg-admin.fly.dev/docs (source: [admin/content/consultant/](./admin/content/consultant/)).
- **Roadmap of deferred work** — [ROADMAP.md](./ROADMAP.md).

> ⚠️ The `admin/` Next.js version has breaking changes from training data — see `admin/AGENTS.md`. Read `admin/node_modules/next/dist/docs/` before writing anything Next-version-sensitive.

---

## Where Claude left off (2026-04-23)

Since the 2026-04-18 handoff, the platform moved from "setup-ready" to **demo-ready**. Specifically:

1. **1Password vault `MBG`** is live with every project secret. Desktop-app CLI integration works; `op read 'op://MBG/...'` fetches values without them touching the transcript.
2. **Admin portal is re-secured and in sync** — Fly secrets rotated, admin DB password rotated, Supabase PAT rotated.
3. **Admin portal got a consultant-facing overhaul** — in-portal `/docs` route with 10 guides, Help & Guides nav link, inline `InfoTooltip` help on the design editor / tenant list / analytics page. Deployed.
4. **MBG tenant is the reference demo** — config refreshed from https://mbgtechnology.com (tagline, 5 services, subscription plans, contact CTAs), plus a stub **Account** tab linking to the client portal for the future knowledgebase.
5. **First real Android preview build exists** and is live at https://mbg-admin.fly.dev/share/mbg — the "Launch browser preview" button opens the Appetize.io player for the actual MBG APK. (Appetize free tier doesn't allow iframe embeds; link-out is the stopgap — see [ROADMAP.md](./ROADMAP.md) for the upgrade plan.)
6. **Playwright E2E suite** covering admin auth, tenant management, config editor, docs, share page, and client portal. 26 passing, 4 documented skips awaiting small `data-testid` adds in the app. CI wired via `.github/workflows/e2e.yml`.
7. **Four EAS workflow bugs fixed** along the way (eas-cli missing from managed build image, `--channel` CLI flag removed, YAML env not flowing to `eas build`, Expo SDK 55 patch drift breaking fingerprint parity). Build + submit pipelines work end-to-end now.

### Still blocked

- **Apple Developer** 1P item is empty — D-U-N-S-based org account enrollment is still pending Apple approval. When the "your account is active" email lands, the iOS half can proceed: ASC API key, APNs push key, provisioning profile, first TestFlight build.
- **Per-tenant Supabase** for any client whose template is not `informational` — first client needing this will trigger the provisioning migration loop in [docs/SETUP.md](docs/SETUP.md).

---

## Deployment

### Admin portal → Fly.io

- **App:** `mbg-admin` — https://mbg-admin.fly.dev
- **Region:** `iad` (one primary machine + one auto-stop backup)
- **Dockerfile:** [admin/Dockerfile](admin/Dockerfile) — standalone Next output
- **fly.toml:** [admin/fly.toml](admin/fly.toml) — auto-stop/auto-start enabled; min 1 running

**Deploy from local:**

```bash
cd admin
fly deploy
# ~3 min: Docker build → rolling deploy across both machines → DNS verify
```

**Secrets on Fly** (names + purpose; values come from 1P via `op inject` into `admin/.env.local`):

```text
NEXT_PUBLIC_SUPABASE_URL          admin portal → central Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY     same, client-side
SUPABASE_SERVICE_ROLE_KEY         bypasses RLS for admin API routes
SUPABASE_ACCESS_TOKEN             Management API PAT for tenant-project provisioning
EXPO_TOKEN                        EAS build dispatch
GITHUB_TOKEN                      dispatches GitHub Actions from admin UI
GITHUB_REPO                       literal "9fourlabs/mbg-technology-mobile"
ADMIN_BUILD_LINK_SECRET           HMAC for build-share URLs; Github-Actions ↔ /api/tenants/[id]/build-link
APPETIZE_API_KEY                  uploads preview APKs to appetize.io for the share page
```

**Sync Fly secrets from 1P** (repeat whenever a secret in 1P rotates):

```bash
cd admin
op inject -i .env.local.tpl -o .env.local
grep -E '^[A-Z_]+=' .env.local | fly secrets import -a mbg-admin
# Triggers rolling restart; ~30 sec downtime per machine
```

No CI for Fly — deploys are manual via `fly deploy`. See [.github/workflows/](.github/workflows/) for EAS (mobile) and E2E workflows.

### Mobile → EAS

- **Expo account:** `ninefour-labs` (authed as GitHub App `@9fourlabs`). Tier: **Starter** (paid, post 2026-04-22).
- **Shared preview project:** `mbg-technology` (ID `8f0869f4-6354-4c29-956a-abf07a54c9b6`) — used by MBG and all preview builds.
- **Per-tenant production projects:** one Expo project per tenant. Placeholders in [scripts/tenantProjects.ts](scripts/tenantProjects.ts).

**Trigger a preview build** (admin portal flow is the normal path, but CLI works too):

```bash
APP_TENANT=mbg EXPO_TOKEN="$(op read 'op://MBG/Expo/credential')" \
  eas build --profile preview --platform android --non-interactive
# Wait ~15 min for FINISHED; then call build-link to chain into Appetize:
# curl -X POST -H "Authorization: Bearer $(op read 'op://MBG/ADMIN_BUILD_LINK_SECRET/password')" ...
```

**EAS workflow gotchas (now fixed but worth knowing):**

- EAS-managed workflow images don't have `eas-cli` pre-installed. `.eas/workflows/*.yml` all run `npm install -g eas-cli` before `eas build`.
- `eas build --channel` flag was removed; channels come from `eas.json` profile now.
- Env vars on the EAS workflow step's `env:` block don't propagate to the child `eas build` process that resolves `app.config.ts` — inline them on the command (`APP_TENANT="${{ inputs.tenant }}" eas build ...`).
- `app.config.ts` runs in both local and cloud build contexts, and the fingerprint mode hashes the plugin list. If a truthy-string bug lets one side include a plugin the other doesn't, you'll hit "Runtime version calculated on local machine not equal to runtime version calculated during build." Use `=== "1"` checks for string env flags, never `? :`.
- GitHub Actions' `eas-preview.yml` polls `eas build:list` for new FINISHED builds after dispatching — if the EAS workflow fails fast (< 30 s), polling can pick up a stale older build instead. See [ROADMAP.md](ROADMAP.md) entry on GH-Actions-should-detect-EAS-workflow-failure.

---

## 1Password — the `MBG` vault

Every project secret lives in 1Password under a vault named **MBG**. Desktop-app CLI integration is enabled; Touch-ID unlock flows into `op` automatically with no password typing.

```bash
op vault list                              # confirms session
op read 'op://MBG/<Item Title>/<field>'    # pull one field (never prints the value via a tool call unless you explicitly echo it — prefer piping into other commands)
op inject -i admin/.env.local.tpl -o admin/.env.local   # render an env file
op run --env-file=admin/.env.local.tpl -- npm run dev   # run a command with secrets in env, no file on disk
```

### Items in the MBG vault

| Item | Category | What it holds |
|------|----------|--------------|
| `MBG Admin Supabase` | Login | central admin DB — `password` (DB), `anon_key`, `service_role_key`, `supabase_url` |
| `Supabase PAT` | API Credential | Management API token — `credential` |
| `Expo` | API Credential | EAS `EXPO_TOKEN` — `credential` |
| `GitHub - mbg-mobile` | API Credential | fine-grained PAT for workflow dispatch — `credential` |
| `Apple Developer` | Secure Note | `team_id`, `asc_api_key_id`, `asc_api_issuer`, `apns_key_id`; .p8 files attached (**currently empty** — awaiting D-U-N-S approval) |
| `Google Play SA` | Secure Note | service-account JSON attached; SA email = `eas-play-publisher@mbg-mobile.iam.gserviceaccount.com` |
| `FCM SA` | Secure Note | service-account JSON attached; SA email = `firebase-adminsdk-fbsvc@mbg-mobile.iam.gserviceaccount.com` |
| `Android Upload Keystore - mbg` | Secure Note | `keystore_password`, `key_alias` (`upload`), `key_password`; `mbg-upload.jks` attached; SHA-1/SHA-256/MD5 fingerprints recorded as fields |
| `ADMIN_BUILD_LINK_SECRET` | Password | HMAC secret for build-share URLs — `password` |
| `Admin Portal - tbrown@9fourlabs.com` | Login | Tim's admin login — `username` + `password` |
| `Playwright Admin Test User` | Login | `playwright-admin@9fourlabs.com` — pre-seeded E2E admin |
| `Playwright Client Test User` | Login | `playwright-client@9fourlabs.com` — pre-seeded E2E client linked only to `mbg` |

Rendering `admin/.env.local` from the op-inject template is the standard pattern; never commit secret values to disk outside the gitignored `.env.local`.

**Hygiene rules:**

- Never `cat`, `echo`, `env | grep`, or `printf` a secret in a tool call — it lands in the transcript and the prompt cache.
- `op read ... | <command>` and `op run --env-file=... -- <command>` are the safe patterns.
- When showing prod/cloud evidence (HTTP codes, digest hashes, config structure), use shape-preserving transforms that don't leak values: `awk` on key=value lines, `curl -I`, Supabase's `digest` field, etc.

---

## End-to-end tests (Playwright)

Located in [admin/tests/e2e/](admin/tests/e2e/). 30 tests across 8 spec files. 26 pass on a clean run, 4 are `test.skip`ed pending tiny app-side `data-testid` additions (each has a `TODO(playwright):` comment).

### Run locally

```bash
cd admin
# Env vars needed at test time:
set -a; source .env.local; set +a
export PLAYWRIGHT_ADMIN_PASSWORD="$(op read 'op://MBG/Playwright Admin Test User/password')"
export PLAYWRIGHT_CLIENT_PASSWORD="$(op read 'op://MBG/Playwright Client Test User/password')"

npm run test:e2e                 # full suite against localhost:3000
npm run test:e2e:ui              # UI mode (great for debugging flaky locators)
npm run test:e2e:smoke-prod      # read-only subset against mbg-admin.fly.dev
npm run test:e2e:report          # HTML report from last run
```

Playwright's `webServer` with `reuseExistingServer: true` means it'll boot `npm run dev` only if nothing's on port 3000 — so it coexists with the preview server or an already-running admin dev.

### How it's wired

- **`playwright.config.ts`** defines 4 projects: `setup` (signs in as both test users, saves `storageState` files), `admin` (uses admin state), `client` (uses client state), `public` (no auth — share page). A fifth `smoke-prod` project activates only when `PLAYWRIGHT_TARGET=prod`.
- **`auth.setup.ts`** handles login. The `waitForURL` for the client case has to exclude `/client/login` explicitly because `/\/client(\/|$)/` matches that too and leaves you with empty storageState on failed login.
- **`helpers/supabase-admin.ts`** gives tests a service-role client for seeding + teardown.
- **`helpers/test-users.ts`** centralizes the two test users. Passwords come from env (never checked in).
- **`global-teardown.ts`** sweeps leftover `playwright-*` tenant rows after the run — belt-and-suspenders for the wizard test.

### Two app bugs the tests surfaced and fixed

1. `supabase.auth.signOut()` default `scope: 'global'` invalidated ALL sessions for the user. Fixed to `scope: 'local'` in both [admin/src/app/api/auth/sign-out/route.ts](admin/src/app/api/auth/sign-out/route.ts) and [admin/src/components/Sidebar.tsx](admin/src/components/Sidebar.tsx).
2. `/login` ignored the `?redirectTo=` param the proxy sets. Fixed in [admin/src/app/login/page.tsx](admin/src/app/login/page.tsx) with same-origin guard.

### CI

[.github/workflows/e2e.yml](.github/workflows/e2e.yml) runs on every PR touching `admin/` and on every push to `main`. Required GitHub Actions secrets:

- `PLAYWRIGHT_ADMIN_PASSWORD`
- `PLAYWRIGHT_CLIENT_PASSWORD`
- plus all the portal-runtime secrets (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `EXPO_TOKEN`, `GITHUB_TOKEN`, `ADMIN_BUILD_LINK_SECRET`, etc.)

As of 2026-04-23 the Playwright-test-user secrets are still pending — set via `op read '...' | gh secret set PLAYWRIGHT_ADMIN_PASSWORD` etc.

### Currently-skipped tests

See [admin/tests/e2e/README.md](admin/tests/e2e/README.md) — each is blocked on a small markup change (data-testid on preset buttons, wizard steps, analytics tile).

---

## New-laptop setup

### Prerequisites

- Node.js 20+
- npm
- Xcode (for iOS local builds — optional, EAS handles cloud builds)
- Android Studio (for Android local emulator — optional)
- **JDK** — Temurin or any OpenJDK 17+. `keytool` needs this. Not installed by default on macOS. Install with `brew install --cask temurin`.
- Docker Desktop (only if you want local Supabase via `supabase start`)
- `gh` CLI authenticated to GitHub (`gh auth login`)
- `fly` CLI authenticated to Fly.io (`fly auth login`)
- `eas` CLI — authed via `EXPO_TOKEN` env var (no `eas login` needed): `npm i -g eas-cli`, then every call uses `EXPO_TOKEN="$(op read 'op://MBG/Expo/credential')" eas ...`
- 1Password 8 desktop app **with CLI integration enabled** (Settings → Developer → "Integrate with 1Password CLI"). 1Password 7 does not expose the CLI socket.

### Get the code

```bash
git clone https://github.com/9fourlabs/mbg-technology-mobile.git
cd mbg-technology-mobile
npm install
cd admin && npm install && cd ..
```

### Render admin `.env.local` from 1P

```bash
op inject -i admin/.env.local.tpl -o admin/.env.local
```

All portal secrets live in 1P now — no manual copy-pasting. The committed `.env.local.tpl` contains the `op://MBG/...` references; the rendered `.env.local` is gitignored.

### Files NOT in the repo (copy from old laptop, 1Password, or regenerate)

| Path | How to get it |
|------|---------------|
| `keystores/mbg-upload.jks` | Attached to `Android Upload Keystore - mbg` in 1P — download via desktop app, OR regenerate with `mkdir -p keystores && npm run generate:keystore -- mbg` if no Play submissions have happened yet |
| `admin/.env.local` | `op inject -i admin/.env.local.tpl -o admin/.env.local` (see above) |

### Run locally

```bash
# Mobile (default tenant: mbg)
npm run start
# Or pick a tenant:
APP_TENANT=sample-booking npm run start

# Admin portal (separate terminal)
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
| Trigger a preview build | admin UI → Tenant → Builds → Preview, OR GitHub Actions workflow dispatch on `eas-preview.yml` |
| Trigger a production submission | admin UI → Tenant → Builds → Production, OR GitHub Actions dispatch on `eas-promote.yml` |
| TypeScript check (mobile) | `npx tsc --noEmit` |
| TypeScript check (admin) | `cd admin && npx tsc --noEmit` |
| Build admin (catches most issues) | `cd admin && npm run build` |
| Deploy admin to Fly | `cd admin && fly deploy` |
| Sync Fly admin secrets from 1P | `grep -E '^[A-Z_]+=' admin/.env.local \| fly secrets import -a mbg-admin` |
| E2E full suite | `cd admin && npm run test:e2e` (see env-var prereqs above) |
| E2E prod smoke | `cd admin && npm run test:e2e:smoke-prod` |

### Pre-existing TS errors (not yours)

One nullability error at `src/hooks/useAnalytics.ts:24` predates the 2026-04-18 work. Safe to leave or fix as a quick chore.

---

## Architecture cheat sheet

```
┌─────────────────────┐         ┌──────────────────────────┐
│  Mobile app         │ HTTPS   │  Admin Next.js app        │
│  (Expo SDK 55)      │────────▶│  mbg-admin.fly.dev        │
│                     │         │                          │
│  reads tenant JSON  │         │  /              MBG      │
│  via APP_TENANT     │         │  /client/*      Client   │
│                     │         │  /share/[t]     Public   │
│                     │         │  /docs/*        MBG admin│
└──────────┬──────────┘         └──────────┬───────────────┘
           │                               │
           │ tenant's Supabase             │ admin Supabase
           │ (per-tenant project)          │ (mbg-admin: tenants, builds,
           │ posts/events/bookings/etc     │  tenant_users, push_tokens,
           ▼                               │  analytics_events)
   ┌──────────────────┐                    │
   │ Tenant Supabase  │◀──── service-role ─┘
   │ (one per tenant) │      from admin API routes
   └──────────────────┘
```

- **Channels for OTA**: `preview` (single shared channel today — per-tenant isolation is a ROADMAP item), `production` (per-tenant Expo project → per-project channel).
- **Native ID modes**: preview Android uses tenant-isolated package via `NATIVE_ID_MODE_ANDROID=tenant`; preview iOS stays shared (provisioning profile constraint); production uses per-tenant on both platforms.
- **Auth**: admin DB is the single auth surface. Three roles:
  - `app_metadata.role = "admin"` in JWT → MBG admin (fast path).
  - `tenant_users` row with `role='admin'` → MBG admin (slow path, DB query).
  - Anything else → client, scoped to `tenant_users.tenant_id` rows for their user.

---

## Git conventions

- Direct commits to feature branches, PRs to `main` for significant changes. Recent Playwright work pushed to `claude/competent-haslett-af6040` — merge when ready.
- Commit messages start with a verb: `Add …`, `Fix …`, `Wire …`. See `git log --oneline -20` for style.
- Co-author footer on Claude commits: `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.

---

## Repository layout (the bits worth knowing)

```
.
├── CLAUDE.md                        # this file
├── CONSULTANT_DEMO.md               # demo + onboarding playbook (for Tim)
├── ROADMAP.md                       # deferred enhancements
├── README.md                        # template-engine README (engineering)
│
├── app.config.ts                    # Expo config — tenant-aware, OTA-wired
├── eas.json                         # Build/submit profiles, channels
├── index.ts                         # Mobile entry (loads templates)
├── App.tsx                          # SafeAreaProvider + ErrorBoundary + AppRoot
├── src/
│   ├── TemplateApp.tsx              # Informational template renderer (SafeAreaView from safe-area-context)
│   ├── *TemplateApp.tsx             # One per template type
│   ├── BaseAuthenticatedApp.tsx     # Shared shell for auth'd templates
│   ├── auth/                        # Supabase client per tenant project
│   ├── components/                  # Shared UI (TabBar, TemplateCard, …)
│   ├── hooks/                       # usePushNotifications, useAnalytics
│   └── templates/                   # Type definitions + per-template renderers
├── configs/
│   ├── tenants-src/<t>.ts           # Authored TS configs (mbg, sample-*)
│   └── tenants/<t>.json             # Compiled JSON (build:tenants)
├── assets/
│   ├── default/                     # Fallback icons/splash
│   └── mbg/                         # MBG-specific icons, splash, adaptive
├── keystores/                       # Android keystores (gitignored — see 1P)
├── scripts/                         # Build, validate, OTA, keystore helpers
├── supabase/migrations/             # Mixed: admin-DB and per-tenant-DB SQL
├── docs/                            # Engineering SOPs
│
├── admin/                           # Next.js admin portal
│   ├── Dockerfile / fly.toml        # Fly.io deploy config
│   ├── playwright.config.ts         # E2E config (projects: setup/admin/client/public/smoke-prod)
│   ├── content/consultant/          # 10-guide in-portal docs (markdown)
│   ├── tests/e2e/                   # Playwright suite (see admin/tests/e2e/README.md)
│   └── src/
│       ├── proxy.ts                 # Route-level auth (replaces pre-Next-16 middleware.ts)
│       ├── app/
│       │   ├── (auth)/docs/         # /docs route rendering content/consultant/*.md
│       │   ├── (auth)/tenants/      # Tenant dashboard + config editor
│       │   ├── client/              # Client portal
│       │   ├── share/[tenantId]/    # Public share page with Launch button
│       │   ├── api/                 # Tenant content proxy, notifications, build-link, …
│       │   └── login/               # Admin login (now honors ?redirectTo=)
│       ├── components/
│       │   ├── Sidebar.tsx          # Main nav (includes Help & Guides link)
│       │   ├── MarkdownViewer.tsx   # react-markdown renderer with link rewriting
│       │   └── InfoTooltip.tsx      # Pure-CSS hover/focus tooltip
│       └── lib/
│           ├── auth/user-context.ts # Role + tenant resolution
│           ├── docs.ts              # Reads content/consultant/*.md
│           ├── appetize.ts          # Appetize.io API client
│           └── supabase/            # server, client, admin (service-role), tenant
│
├── .eas/workflows/                  # EAS workflows (preview-tenant, release-tenant, ota)
└── .github/workflows/               # GitHub Actions — eas-preview, eas-promote, eas-ota, e2e
```

---

## Quick links

- Repo: https://github.com/9fourlabs/mbg-technology-mobile
- Admin portal: https://mbg-admin.fly.dev
- Consultant guides (live): https://mbg-admin.fly.dev/docs
- Share page for MBG preview: https://mbg-admin.fly.dev/share/mbg
- Fly app dashboard: https://fly.io/apps/mbg-admin
- Expo org: https://expo.dev/accounts/ninefour-labs
- Central Supabase: https://supabase.com/dashboard/project/wmckytfxlcxzhzduttvv
