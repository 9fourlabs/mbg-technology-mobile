## App Store + Play Store Submission

End-to-end procedure for shipping a tenant to both stores via EAS Submit.

The short version: per-tenant identifiers (numeric ASC App ID, Play package) live in `configs/tenants/<tenant>.json` under `appStore`. Shared credentials (ASC API key, Play service account) are uploaded to EAS once and stored server-side — never committed.

---

### One-time setup (MBG, per Apple Developer / Google Play account)

#### Apple Developer / App Store Connect

1. **Create an App Store Connect API key** (if one doesn't exist):
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Users and Access** → **Integrations** → **App Store Connect API**.
   - Click **+ Generate API Key**. Role: **App Manager** (minimum).
   - Download the `.p8` file — **this is the only time you can download it**. Store in 1Password under `mbg-mobile/shared/asc-api-key.p8`.
   - Note the **Key ID** and **Issuer ID** shown on the page.

2. **Capture the Apple Team ID:**
   - Apple Developer portal → **Membership** → Team ID (e.g. `ABC123DEF`).
   - Store in 1Password under `mbg-mobile/shared/apple-team-id`.

3. **Upload the ASC API key to EAS** (stores it server-side):

   ```bash
   eas credentials
   # Select: iOS → production → App Store Connect API Keys → Add a new key
   # Paste the .p8 contents, Key ID, Issuer ID
   ```

   EAS will use this key for `eas submit --platform ios` across every Expo project you own — no per-tenant re-upload needed.

4. **Set the Apple Team ID as a GitHub Actions secret:**
   - Repo → Settings → Secrets and variables → Actions → **New repository secret**
   - Name: `APPLE_TEAM_ID`, Value: the Team ID from step 2.

#### Google Play Console

1. **Create a Play Console service account** (one per Expo project in practice — but MBG can start with one shared service account if all tenants are under the same Play Developer account):
   - [Play Console](https://play.google.com/console) → **Users and permissions** → **Invite new users** → API access section.
   - Or directly in [Google Cloud Console](https://console.cloud.google.com) → IAM → Service accounts → Create service account.
   - Grant role: **Release manager** (or **Admin** for first upload).
   - Generate a JSON key; download and store in 1Password as `mbg-mobile/shared/play-service-account.json`.

2. **Link the service account to Play Console:**
   - Play Console → **Users and permissions** → grant the service account email **Release manager** permission on every tenant's app listing.

3. **Upload the service account JSON to EAS** per tenant Expo project:

   ```bash
   APP_TENANT=<tenant> NATIVE_ID_MODE=tenant \
     eas credentials --platform android
   # Select: production → Google Service Account → Upload a new key
   # Provide the path to play-service-account.json
   ```

   Repeat for each tenant's Expo project.

---

### Per-tenant setup (once, when a tenant goes from preview → store)

1. **iOS: register the app in App Store Connect:**
   - [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → **+ New App**.
   - Platform: iOS. Name, primary language, SKU (use the tenant ID).
   - Bundle ID: select the one matching `app.config.ts` (`com.mbg.info.<tenant>` with dots-not-hyphens).
   - Save.
   - Go to **App Information** → note the numeric **Apple ID** (e.g. `1234567890`).

2. **Android: register the app in Play Console:**
   - [Play Console](https://play.google.com/console) → **Create app**.
   - App name, default language, app/game, free/paid.
   - Complete the required declarations (content rating, data safety, target audience) — Play Console will gate submission on these; they can be done later but must be done before first release.
   - Go to **Setup → App signing** → confirm Play App Signing is enabled. Upload the tenant's upload key certificate:

     ```bash
     keytool -exportcert \
       -alias upload \
       -keystore "keystores/<tenant>-upload.jks" \
       -rfc \
       -file "<tenant>-upload-cert.pem"
     # Upload the .pem to Play Console, then delete it locally.
     ```

3. **Populate tenant config:**
   - Admin portal → your tenant → **Config** → **App Store** tab → **Store Submission** section.
   - Paste the numeric **App Store Connect App ID** from step 1.
   - (Android package defaults correctly; only override if Play Console registered a different package name.)
   - Save. This regenerates `configs/tenants/<tenant>.json` with `appStore.iosAscAppId` populated.

4. **Create a dedicated Expo project for the tenant** (if not done already):
   - [expo.dev](https://expo.dev) → **Create project** → name it `info-<tenant>`.
   - Grab the project UUID.
   - Edit `scripts/tenantProjects.ts` and replace the placeholder entry with the new UUID.
   - Commit.

5. **Upload the Android Play service account to this tenant's Expo project** (one-time, if this is the first time the project has seen Android):

   ```bash
   APP_TENANT=<tenant> NATIVE_ID_MODE=tenant \
     eas credentials --platform android
   ```

---

### Running a submission

Once the above is done, submission is a one-click action:

**From GitHub Actions:**

1. Actions → **EAS Promote to Production** → **Run workflow**.
2. Fill in `tenant`, `platform` (`ios` / `android` / `both`), `version`.
3. The workflow:
   - Validates production readiness (dedicated Expo project, no placeholders, `iosAscAppId` populated if submitting iOS).
   - Runs `eas build --profile production --platform <p>` for the tenant's project.
   - Runs `eas submit --profile production --platform <p>` — env vars are hydrated from the tenant config by `scripts/getSubmitEnv.ts`.

**From the command line** (equivalent):

```bash
APPLE_TEAM_ID=<your team> \
  eval "$(npx tsx scripts/getSubmitEnv.ts <tenant> ios)" \
  && APP_TENANT=<tenant> NATIVE_ID_MODE=tenant \
     eas submit --profile production --platform ios \
     --project-id "$(npx tsx scripts/getProjectId.ts <tenant>)"
```

---

### What ends up where

| Secret | Storage | Scope |
|--------|---------|-------|
| ASC API key (`.p8`) | EAS (uploaded once) + 1Password backup | Apple Developer account (all tenants) |
| Apple Team ID | GitHub Actions secret + 1Password | Apple Developer account (all tenants) |
| Play service account (`.json`) | EAS per project + 1Password backup | Per Expo project (≈ per tenant for prod) |
| Android upload keystore | `keystores/<tenant>-upload.jks` (gitignored) + EAS + 1Password for password | Per tenant |
| `iosAscAppId` | `configs/tenants/<tenant>.json` (committed, non-secret) | Per tenant |

---

### Troubleshooting

**`eas submit` asks for the ASC key interactively in CI:**
The key wasn't uploaded to EAS, or EAS lost the association. Re-run `eas credentials` locally with the stored `.p8`.

**"Invalid provisioning profile" on iOS submit:**
The existing provisioning profile doesn't match the bundle ID. Run `eas credentials --platform ios` and let EAS regenerate the profile.

**"You cannot use this service account to access this app" on Android submit:**
The service account email wasn't granted Release Manager on that tenant's Play Console app. Grant it, wait 5 minutes, retry.

**Push notifications entitlement error on iOS:**
Related to push, not submission directly — see `docs/PUSH_NOTIFICATIONS.md` (pending). The quick fix is to regenerate the provisioning profile with the push capability enabled.
