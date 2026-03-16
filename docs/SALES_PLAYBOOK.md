## Sales Playbook: Informational Apps

### What we’re selling

- A **templated mobile app** (iOS/Android) that presents:
  - Brand (logo + colors)
  - A few simple tabs (Home, Services, Plans, Contact, etc.)
  - Uniform cards with images, text, and buttons (open URLs)
- We can quickly spin up **demo builds** and, once approved, submit a **client-branded app** to the app stores.

### What sales needs to collect from a client

For each new client:

- **Tenant ID** (internal / slug)
  - Example: `mbg`, `acme-dental`, `smith-law`
- **Branding**
  - Logo URL (or logo asset we can host)
  - Primary color (hex, e.g. `#FF9900`)
  - Background color (hex)
- **Tabs (2–4 recommended)**
  - Tab label (ex: `Home`, `Services`, `Plans`, `Contact`)
  - Header title (short, e.g. `Welcome to Acme Dental`)
  - Header body (1–2 sentence description)
- **Cards per tab (1–3 recommended)**
  - Title
  - 1–2 sentence body
  - Optional image URL (stock image is fine)
  - Optional button:
    - Label (e.g. `Book now`, `Visit site`)
    - URL (website, booking link, or `tel:+15555555555` for call buttons)

### Internal steps to create a new demo app

Developer steps:

1. **Create a new tenant source (TypeScript)**
   ```bash
   npm run new-tenant <tenant-id>
   ```
   - This scaffolds `configs/tenants-src/<tenant-id>.ts`.
   - Fill in the brand, tabs, and cards from the sales intake.

2. **Generate JSON configs and validate**
   ```bash
   npm run build:tenants
   npm run validate:tenants
   ```

3. **Register the tenant in the loader**
   - Edit `src/templates/informational/index.ts` and add:
     - an import for `configs/tenants/<tenant-id>.json`
     - an entry in the `jsonTenants` map.

4. **Run locally for QA**
   ```bash
   APP_TENANT=<tenant-id> npm run start
   ```
   - Launch on iOS and Android simulators and confirm:
     - Branding looks correct
     - Tabs and cards have expected text
     - Buttons open the right URLs

5. **Open a PR**
   - Commit changes on a feature branch.
   - Open a PR into `main`.
   - On PR, the GitHub Actions `EAS Preview Builds` workflow:
     - Detects which tenant JSONs changed
     - Builds preview apps for those tenants (iOS + Android)
     - (Optional next step: comment preview links on the PR)

6. **Share preview builds with the client**
   - Copy the preview URLs (from Expo/EAS) for the tenant.
   - Send to the client for installation on test devices.

### After client approval

1. **(Optional) Create a dedicated Expo project**
   - In the Expo dashboard, create a new project for the client.
   - Add its `projectId` to the mapping in:
     - `.github/workflows/eas-preview.yml`
     - `.github/workflows/eas-promote.yml`

2. **Run production build & submit**
   - Use the `EAS Promote to Production` workflow:
     - Input `tenant = <tenant-id>`
     - Input `platform = ios`, `android`, or `both`
   - This runs `eas build --profile production` and `eas submit` for that tenant.

3. **Communicate with the client**
   - Share store links once the app is approved.
   - Provide guidance on how end users install and use the app.

