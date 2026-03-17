## MBG Template Development Process (End-to-End)

This document defines the standard workflow for building client apps using MBG’s **template-as-an-API** approach (starting with the **Informational Template**).

### 1) Inputs (what Sales / PM provides)

For every client, collect:

- **Tenant key**: e.g. `mbg`, `acme-dental`, `smith-law`
- **Branding**
  - logo URL (or local asset)
  - primary color
- **Tabs**
  - tab labels (ex: Home / Services / Plans / Contact)
  - tab header title + header body text
- **Cards (per tab)**
  - image URL (stock image ok) or “no image”
  - card title
  - card body text
  - optional CTA button label + destination URL

Deliver these in a structured block (can be copied into a prompt).

### 2) Prompting workflow (how you ask the AI)

We treat templates like an API contract. The prompt should specify:

- **Template ID**: `informational`
- **Tenant key**
- **Brand object**
- **Tabs[]** with **Cards[]**
- Any constraints (uniform cards, same card height, image optional, etc.)

An example prompt is in `docs/PROMPT_EXAMPLES.md`.

### 3) Repo workflow (template content is data)

In this repo:

- **Template types**: `src/templates/types.ts`
- **Template data (per tenant)**:
  - Authoring (TypeScript): `configs/tenants-src/<tenant>.ts`
  - Generated JSON (runtime): `configs/tenants/<tenant>.json` (via `npm run build:tenants`)
  - Loader: `src/templates/informational/index.ts`
- **Renderer**: `src/TemplateApp.tsx`
- **Reusable UI building blocks**:
  - `src/components/PageHeader.tsx`
  - `src/components/TemplateCard.tsx`
  - `src/components/TabBar.tsx`

Rule: client customizations should primarily be **template data changes** in the TS configs, not layout rewrites.

### 4) Running locally in Cursor + emulator

#### Install

```bash
npm install
```

#### Start dev server

```bash
npm run start
```

#### Launch emulator/simulator

In the Expo terminal:
- press `i` for iOS Simulator
- press `a` for Android Emulator

Or run directly:

```bash
npm run ios
```

```bash
npm run android
```

#### Run a specific tenant locally

```bash
APP_TENANT=mbg npm run start
```

(Later, each client gets their own tenant key, which swaps template data and app identifiers.)

### 5) Making updates (the “API” usage)

#### Update a header
- Edit the tab’s `headerTitle` / `headerBody` in the tenant template file (ex: `src/templates/informational/mbg.ts`).

#### Update a card
- Change `title`, `body`, `imageUri`, or `action`.

#### Add a new section
- Add a new card in the `cards[]` list for the appropriate tab.

#### Reorder sections
- Reorder cards in `cards[]`. UI automatically updates.

### 6) Multi-tenant configs + CI workflows

- Tenant configs:
  - live in `configs/tenants/<tenant>.json`
  - follow the `InformationalTemplate` shape from `src/templates/types.ts`
  - are loaded by `src/templates/informational/index.ts` based on `APP_TENANT`
- GitHub Actions:
  - `.github/workflows/eas-preview.yml` – on PRs, detects changed tenants and triggers the EAS Workflow `.eas/workflows/preview-tenant.yml`
  - `.github/workflows/eas-promote.yml` – manual trigger that runs the EAS Workflow `.eas/workflows/release-tenant.yml`

- EAS Workflows:
  - `.eas/workflows/preview-tenant.yml` – creates iOS/Android preview builds for a specific tenant
  - `.eas/workflows/release-tenant.yml` – builds + submits store builds for a specific tenant/platform

- Tenant → Expo project mapping:
  - `scripts/tenantProjects.ts` (used by `scripts/getProjectId.ts`)

These workflows assume a valid `EXPO_TOKEN` secret in the GitHub repo.

### 7) Production publishing (Expo + EAS)

This repo is already set up for EAS via `eas.json`.

Typical flow:

1. Authenticate:
   - `npx eas login`
2. Development build (internal):
   - `npx eas build --profile development --platform ios`
   - `npx eas build --profile development --platform android`
3. Preview build (internal QA / stakeholder review):
   - `npx eas build --profile preview --platform ios`
   - `npx eas build --profile preview --platform android`
4. Production build:
   - `npx eas build --profile production --platform ios`
   - `npx eas build --profile production --platform android`
5. Submit to stores:
   - `npx eas submit --profile production --platform ios`
   - `npx eas submit --profile production --platform android`

### 8) Multi-tenant / white-label strategy

There are two supported models:

#### Model A (recommended for store apps): “One app per client”

Each client is a separate app listing with unique:
- iOS `bundleIdentifier`
- Android `package`
- name/icon/splash (optional)
- template content

Pros:
- clean separation
- best store compliance
- easy approvals and updates per client

Cons:
- more app listings to manage

This repo supports it via:
- `APP_TENANT=<tenant>` environment variable
- `app.config.ts` generating tenant-specific identifiers

#### Model B (single app, multiple tenants inside)

One store listing, user selects tenant or logs in to load tenant content from a backend.

Pros:
- one app to maintain
- instant tenant provisioning (server-driven)

Cons:
- “multi-client” content inside one app can be confusing for app stores and users
- requires backend/auth and careful UX

### 9) Demo distribution before approval (sales enablement)

Goal: allow prospects to install a demo app quickly.

Recommended options:

- **iOS**
  - EAS internal distribution + TestFlight for external testers
- **Android**
  - EAS internal distribution (APK/AAB) + Google Play Internal testing track
  - or direct APK distribution for quick demos (less ideal long-term)

Operational approach:
- Maintain a “demo” tenant per prospect, built with `--profile preview`.
- Share install links with the prospect.
- Once approved, promote the same tenant to production identifiers + store submission.

