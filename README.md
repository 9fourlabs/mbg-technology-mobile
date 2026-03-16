## MBG Technology Mobile Templates

This repo is a **template engine for informational Expo apps**. Each client app is just a **JSON config**; the layout and UI code stay the same.

### Core concepts

- **Template type**: `informational`
  - Tabs (Home / Services / Plans / Contact, etc.)
  - Each tab has a **header** and a list of **uniform cards**
  - Cards can have: image, title, body text, optional CTA button (open URL)
- **Tenants**: one JSON file per app/client.

### Where things live

- **Tenant configs (apps)**: `configs/tenants/<tenant>.json`
  - `brand.logoUri`
  - `brand.primaryColor`, `brand.backgroundColor`, `brand.textColor`, `brand.mutedTextColor`
  - `tabs[]` with `headerTitle`, `headerBody`, and `cards[]`
- **Template types**: `src/templates/types.ts`
- **Template loader**: `src/templates/informational/index.ts`
- **Renderer app**: `src/TemplateApp.tsx`
  - Reads tenant from Expo `extra.tenant` / `APP_TENANT`
  - Renders header (`PageHeader`), cards (`TemplateCard`), and tabs (`TabBar`)

### Add a new app (tenant)

1. **Create a JSON config**
   - Copy an existing one, e.g. `configs/tenants/mbg.json` or `big-worms-pet-shop.json`.
   - Save as `configs/tenants/<tenant-id>.json` (e.g. `acme-dental.json`).
   - Fill in:
     - `brand` colors + logo URL
     - `tabs[]` and `cards[]` (content, stock images, URLs)
2. **Register the tenant**
   - Add it to the `jsonTenants` map in `src/templates/informational/index.ts`.

That’s it: no layout changes required. The app will render the new tenant’s content with the shared UI.

### Local development & testing

Install dependencies:

```bash
npm install
```

Run the default tenant (MBG):

```bash
npm run start          # or: npx expo start
```

Run a specific tenant (e.g. Big Worms Pet Shop):

```bash
APP_TENANT=big-worms-pet-shop npm run start
```

In the Expo dev server:

- Press `i` for **iOS Simulator**
- Press `a` for **Android Emulator**

Or run directly:

```bash
npm run ios
npm run android
```

### Workflow: from change to preview to production

**Typical flow for a new or updated tenant:**

1. Create/update `configs/tenants/<tenant>.json`.
2. Register the tenant in `src/templates/informational/index.ts` (only when adding a new one).
3. Run locally with `APP_TENANT=<tenant> npm run start` and verify iOS/Android.
4. Commit to a feature branch and open a **PR** into `main`.

**GitHub Actions + EAS:**

- `.github/workflows/eas-preview.yml`
  - On PRs into `main`, detects which `configs/tenants/*.json` files changed.
  - Builds **preview iOS/Android apps** only for those tenants using `eas build --profile preview`.
- `.github/workflows/eas-promote.yml`
  - Manual workflow (from the Actions tab).
  - Inputs: `tenant` and `platform`.
  - Builds and **submits production iOS/Android apps** via `eas build` + `eas submit`.

To use EAS in CI, configure an `EXPO_TOKEN` secret in the GitHub repo.

### More details

- **Template spec**: `docs/INFORMATIONAL_TEMPLATE.md`
- **End-to-end process** (prompts, Cursor, emulators, CI, stores, multi-tenant): `docs/DEVELOPMENT_PROCESS.md`
- **Prompt examples** for generating/updating tenant JSON: `docs/PROMPT_EXAMPLES.md`

