# Admin E2E tests

End-to-end tests for the MBG admin portal, driven by Playwright. These verify the consultant-facing surfaces survive a deploy — login, tenant list, config editor, docs route, share page, and the client portal.

## What's covered

| Spec | Scope |
|------|-------|
| `admin-auth.spec.ts` | Login form, bad creds, deep-link preservation, sign out |
| `admin-tenants.spec.ts` | My Apps dashboard, sidebar nav to every top-level page, settings health panel, status-pill tooltip |
| `admin-config.spec.ts` | Config editor — all 6 tabs clickable, design preset switching, inline help tooltips, App Store fields |
| `admin-create.spec.ts` | Tenant creation wizard walked step-by-step → row lands in admin DB |
| `admin-docs.spec.ts` | `/docs` renders, sidebar lists all 10 guides, cross-guide link rewriting works, 404 for unknown slug |
| `share-page.spec.ts` | Public `/share/[tenantId]` is reachable without auth, Launch button present + points to appetize.io, expand install section, 404 for unknown tenant |
| `client-portal.spec.ts` | Client-scoped view, analytics metric tooltips, RLS-equivalent 404 when accessing foreign tenant, unauth redirect |
| `smoke-prod.spec.ts` | Read-only subset that runs against `mbg-admin.fly.dev` after each deploy |

## Prereqs (local)

1. **Test users** already seeded in the admin Supabase (created once during test setup):
   - `playwright-admin@9fourlabs.com` — role `admin` (full access)
   - `playwright-client@9fourlabs.com` — linked to tenant `mbg` only

   Passwords are stored in 1Password under the **MBG** vault:
   - `Playwright Admin Test User`
   - `Playwright Client Test User`

2. **Environment vars** (source from `admin/.env.local` plus the 1P-stored passwords):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (in `admin/.env.local`)
   - `PLAYWRIGHT_ADMIN_PASSWORD`, `PLAYWRIGHT_CLIENT_PASSWORD` (sourced from 1P at run time)

3. Browsers installed: `npx playwright install chromium` (one time).

## Run

### Full suite against local dev

```bash
# One-shot with env vars loaded from 1P
cd admin
export $(grep -v '^#' .env.local | xargs)
export PLAYWRIGHT_ADMIN_PASSWORD="$(op read 'op://MBG/Playwright Admin Test User/password')"
export PLAYWRIGHT_CLIENT_PASSWORD="$(op read 'op://MBG/Playwright Client Test User/password')"
npm run test:e2e
```

Playwright will spin up `npm run dev` automatically if nothing is already on port 3000 (see `webServer` in `playwright.config.ts`).

### Interactive UI mode (great for debugging flaky locators)

```bash
npm run test:e2e:ui
```

### HTML report after a run

```bash
npm run test:e2e:report
```

### Post-deploy prod smoke

```bash
# BASE_URL comes from the config when PLAYWRIGHT_TARGET=prod
npm run test:e2e:smoke-prod
```

Only `smoke-prod.spec.ts` runs in this mode. Auth is skipped — only public routes are exercised.

## CI

`.github/workflows/e2e.yml` runs the full suite on every PR that touches `admin/` and on every push to `main`. After the prod deploy job completes it also kicks off the smoke-prod subset.

GitHub Actions secrets required:
- `PLAYWRIGHT_ADMIN_PASSWORD`
- `PLAYWRIGHT_CLIENT_PASSWORD`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Plus whatever the portal itself normally needs at build-time (`EXPO_TOKEN`, `GITHUB_TOKEN`, `ADMIN_BUILD_LINK_SECRET`, etc.).

## Re-seeding test users

If the test users ever get deleted or you want to rotate passwords:

```bash
# Generate new passwords and insert/update the Supabase users, then
# save the new passwords to 1Password. Run from repo root.
# (This was the script used to seed them originally — check git log for context.)
```

See the commit that added this suite for the exact seeding snippet.

## Known TODOs (tests currently `test.skip`ed)

Four tests are skipped because they need small UX/markup affordances in the
app itself before they can be written reliably. Each `test.skip` has a
`TODO(playwright):` comment above it explaining the specific ask. Summary:

- **`admin-config — design editor presets switch visually`** — Preset
  buttons ("Modern" / "Classic" / ...) have duplicate text matches with
  their description subtitle. Needs either a `data-testid` on the preset
  grid buttons in [design-editor.tsx](../../src/app/(auth)/tenants/[id]/config/design-editor.tsx)
  or a more specific role+aria-label.
- **`admin-create — tenant creation wizard (end-to-end)`** and
  **`admin-create — cancel / back`** — The 6-step wizard uses non-semantic
  `<button>` / `<input>` elements without `<label htmlFor>`. Options:
  add `data-testid` attributes on each step's primary control, or test the
  `/api/tenants/create` route directly with a Playwright request fixture.
- **`client-portal — analytics tiles + tooltips`** — Analytics tile label
  ("Events") is a raw text node in an `inline-flex` div with the
  `InfoTooltip` as a sibling; `getByText` races against the page's initial
  data fetch and often finds it not-visible. Add a `data-testid` on the
  metric tile wrapper.

Each TODO is a small change. The tests themselves are left in place with
their `test.skip` so they'll unskip automatically once the markup adds a
selector stable enough to rely on.

## Cleanup / test isolation

- The tenant-creation wizard test uses a unique slug `playwright-test-<timestamp>` so parallel runs don't collide.
- Each test cleans up its own rows on success.
- `global-teardown.ts` sweeps any leftover `playwright-%` tenants at the end of a full run as insurance against crashes mid-test.
