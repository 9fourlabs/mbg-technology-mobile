## Operational Setup Checklist

Everything you need to do **outside this repo** to take the platform from "code is in place" to "you can ship a tenant's app to the App Store + Play Store and iterate on it."

Work top to bottom; later steps depend on earlier ones. Items marked **(per tenant)** repeat for every client app you build.

---

### A. Once for the whole platform

#### A1. Apple Developer (one-time)

- [ ] **App Store Connect API key**
  - [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → Users and Access → Integrations → App Store Connect API → **+ Generate API Key**.
  - Role: **App Manager**.
  - Download the `.p8` (this is your only chance). Store in 1Password under `mbg-mobile/shared/asc-api-key.p8`.
  - Note the **Key ID** and **Issuer ID**.
- [ ] **Apple Team ID**
  - Apple Developer portal → Membership → Team ID (e.g. `ABC123DEF`). Store in 1Password.
- [ ] **Apple Push Key (.p8)** — only if you'll use push notifications
  - Apple Developer portal → Certificates, IDs & Profiles → Keys → **+** → check **Apple Push Notifications service (APNs)**.
  - Download `.p8`, note Key ID. Store in 1Password.
- [ ] **Upload ASC API key to EAS:**
  ```bash
  eas credentials
  # iOS → production → App Store Connect API Keys → Add a new key
  # Paste .p8 contents, Key ID, Issuer ID
  ```
- [ ] **Upload Apple Push Key to EAS** (if using push):
  ```bash
  eas credentials
  # iOS → production → Push Notifications → Set up Push Notifications
  ```
- [ ] **GitHub repo secret: `APPLE_TEAM_ID`**
  - Repo → Settings → Secrets and variables → Actions → New repository secret.

#### A2. Google Play Console (one-time)

- [ ] **Play Console service account**
  - [Google Cloud Console](https://console.cloud.google.com) → IAM → Service accounts → Create.
  - Generate JSON key, download. Store in 1Password under `mbg-mobile/shared/play-service-account.json`.
- [ ] **Link service account in Play Console**
  - [Play Console](https://play.google.com/console) → Users and permissions → Invite user (using the service account email) → grant **Release manager**.
- [ ] **FCM service account JSON** — only if using push on Android
  - Firebase console → your project → Project Settings → Service accounts → **Generate new private key**.
  - Store in 1Password.
- [ ] **Upload FCM service account to EAS** (if using push):
  ```bash
  eas credentials  # Android → production → FCM V1 service account → Upload
  ```

#### A3. GitHub Actions secrets

Repo → Settings → Secrets and variables → Actions:

- [ ] `EXPO_TOKEN` — your Expo personal access token (probably already set).
- [ ] `APPLE_TEAM_ID` — see A1.
- [ ] `ADMIN_URL` — public URL of the admin portal (e.g. `https://admin.mbgtechnology.com`). Lets the build workflows call back into the admin to attach build artifacts.
- [ ] `ADMIN_BUILD_LINK_SECRET` — any random 32+ char string. Same value also goes into the admin's runtime env (`ADMIN_BUILD_LINK_SECRET`) so the callback authenticates.

#### A4. Admin database (one-time)

The admin DB is the central Supabase project storing the `tenants`, `builds`, `tenant_users`, `push_tokens`, `analytics_events`, etc. tables.

- [ ] **Apply all migrations** in `supabase/migrations/` against the admin DB, in order. Plus the bootstrap from `admin/supabase-setup.sql`. Use whichever tool you already have wired (Supabase CLI / dashboard SQL editor / psql).
  - Migrations 015, 016, 017, 018 are the new ones from this batch.
- [ ] **Bootstrap an MBG admin user** — after running migration 015:
  ```sql
  -- Either via Supabase Auth dashboard: set app_metadata.role = "admin" on
  -- the user (Authentication → Users → click user → Raw User App Meta Data).
  --
  -- Or via SQL after creating the users:
  INSERT INTO tenant_users (user_id, tenant_id, role)
  SELECT id, 'mbg', 'admin'
  FROM auth.users
  WHERE email IN ('you@mbgtechnology.com');
  ```

---

### B. Per tenant

Repeat for every client app you onboard.

#### B1. Expo project

- [ ] Create a dedicated Expo project at [expo.dev](https://expo.dev) named `info-<tenant>`.
- [ ] Copy the project UUID.
- [ ] In the admin portal: Tenant → Config → App Store tab → paste into **Expo Project ID** and Save. The save handler propagates this to `scripts/tenantProjects.ts` automatically (via a GitHub commit) so the build workflow can find it.

#### B2. iOS app registration

- [ ] [App Store Connect](https://appstoreconnect.apple.com) → My Apps → **+ New App**.
- [ ] Bundle ID: select the one matching `app.config.ts` for this tenant (`com.9fourlabs.mbg.<tenant-with-dots>`).
- [ ] After creation, App Information → note the numeric **Apple ID** (e.g. `1234567890`).
- [ ] In the admin portal: Tenant → Config → App Store tab → paste into **App Store Connect App ID**.

#### B3. Android keystore + Play Console listing

- [ ] Generate a per-tenant upload keystore:
  ```bash
  npm run generate:keystore -- <tenant-id>
  ```
- [ ] Store the printed password in 1Password under `mbg-mobile/<tenant>/android-keystore-password`.
- [ ] Upload the keystore to EAS:
  ```bash
  APP_TENANT=<tenant> NATIVE_ID_MODE=tenant eas credentials --platform android
  # Select: production → Upload a keystore
  ```
- [ ] Create the app in Play Console; complete the data safety / content rating questionnaires.
- [ ] Extract and upload your upload-key certificate (see [docs/STORE_SUBMISSION.md](STORE_SUBMISSION.md) for the `keytool -exportcert` command).
- [ ] Upload the Play service account to this tenant's Expo project:
  ```bash
  APP_TENANT=<tenant> NATIVE_ID_MODE=tenant eas credentials --platform android
  # Select: production → Google Service Account → Upload
  ```

#### B4. iOS push capability (only if this tenant will use push)

- [ ] Apple Developer portal → Identifiers → click the App ID for this tenant → Capabilities → check **Push Notifications** → Save.
- [ ] Regenerate the iOS provisioning profile so it includes the entitlement:
  ```bash
  APP_TENANT=<tenant> NATIVE_ID_MODE=tenant eas credentials --platform ios
  # → Build credentials → All: Set up build credentials (let EAS regenerate)
  ```
- [ ] Toggle **Enable push notifications** in admin → Tenant → Config → App Store tab.

#### B5. Test the pipeline

- [ ] Trigger a preview build from admin → Tenant → Builds → **Preview**.
- [ ] Once it finishes, confirm:
  - Browser preview loads (Appetize)
  - QR code installs on Android
  - iOS install link works
- [ ] Push test (if enabled): admin → Tenant → click "Open client portal as MBG admin" → Notifications → Send a test.
- [ ] Trigger a production build: admin → Tenant → Builds → **Production**.
- [ ] Confirm submission appears in App Store Connect / Play Console internal track.

#### B6. Hand off to client

- [ ] In Supabase Auth dashboard, create a user for the client's primary contact.
- [ ] Add a `tenant_users` row linking that user to this tenant with role `client`:
  ```sql
  INSERT INTO tenant_users (user_id, tenant_id, role)
  SELECT id, '<tenant-id>', 'client'
  FROM auth.users
  WHERE email = 'client@example.com';
  ```
- [ ] Send the client the URL `https://admin.mbgtechnology.com/client/login` and their credentials (encourage them to reset password).

---

### C. Mobile-app runtime config (build-time env)

These are set automatically by the build workflows; listed here for reference / local-dev overrides.

| Env var | Set by | Purpose |
|---------|--------|---------|
| `APP_TENANT` | workflow | Which tenant to build (selects assets + JSON config) |
| `NATIVE_ID_MODE_ANDROID` / `NATIVE_ID_MODE_IOS` | workflow | `shared` (preview) vs `tenant` (production) bundle IDs |
| `EAS_PROJECT_ID` | workflow (production only) | Per-tenant Expo project — drives OTA URL too |
| `APP_VERSION` | workflow input | Semver string |
| `EXPO_PUSH_ENABLED` | workflow (from admin toggle) | Includes `expo-notifications` plugin in the build |
| `EXPO_PUBLIC_ADMIN_URL` | optional override (defaults to `admin.mbgtechnology.com`) | Where the mobile app POSTs push tokens / analytics |

---

### D. References

- Admin store submission: [docs/STORE_SUBMISSION.md](STORE_SUBMISSION.md)
- Push notifications: [docs/PUSH_NOTIFICATIONS.md](PUSH_NOTIFICATIONS.md)
- OTA updates: [docs/OTA_UPDATES.md](OTA_UPDATES.md)
- Keystore SOP: [docs/KEYSTORE_SOP.md](KEYSTORE_SOP.md)
- Original development process: [docs/DEVELOPMENT_PROCESS.md](DEVELOPMENT_PROCESS.md)
