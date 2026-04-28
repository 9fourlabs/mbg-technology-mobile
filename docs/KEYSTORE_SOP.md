## Keystore & Signing Credential SOP

Standard operating procedures for managing Android keystores and iOS signing credentials across all tenants.

---

### Overview

Every production Android app needs an **upload keystore** to sign builds before submission to Google Play. iOS apps need **distribution certificates** and **provisioning profiles**. This document covers generation, storage, rotation, and disaster recovery for both platforms.

**Cardinal rules:**

1. Never commit signing credentials to git (enforced via `.gitignore`).
2. Every credential password must be stored in the team vault — not in heads, not in plaintext files.
3. Every production tenant gets its own keystore. Never share a production keystore across tenants.
4. Preview builds use EAS-managed shared credentials and are exempt from these requirements.

---

### Credential modes

| Mode | When | Identifiers | Credentials |
|------|------|-------------|-------------|
| `NATIVE_ID_MODE=shared` | Preview / demo builds | All tenants use `com.9fourlabs.mbg.app` | EAS-managed (automatic) |
| `NATIVE_ID_MODE=tenant` | Production / store builds | Each tenant gets `com.9fourlabs.mbg.<tenant>` | Per-tenant keystore + certs (see below) |

Preview builds require **zero** manual credential setup — EAS generates and manages them. The rest of this document applies to **production builds only**.

---

### Android: upload keystore management

#### Generating a new keystore

Use the helper script (see `scripts/generateKeystore.sh`):

```bash
npm run generate:keystore -- <tenant-id>
```

This script:
1. Generates a new PKCS12 keystore at `keystores/<tenant-id>-upload.jks`.
2. Prints the keystore password and key alias.
3. Reminds you to store the password in the vault.

If you prefer to generate manually:

```bash
keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore "keystores/<tenant-id>-upload.jks" \
  -alias "upload" \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=MBG Technology, OU=Mobile, O=MBG Technology LLC, L=City, ST=State, C=US"
```

`keytool` will prompt for a password. Use a strong random password (32+ characters, alphanumeric).

#### Registering with EAS

After generating, configure EAS to use it for the tenant's production builds:

```bash
APP_TENANT=<tenant-id> NATIVE_ID_MODE=tenant \
  eas credentials --platform android
```

Select: **Upload a keystore** and provide:
- Keystore path: `keystores/<tenant-id>-upload.jks`
- Keystore password: (from vault)
- Key alias: `upload`
- Key password: (same as keystore password for PKCS12)

#### Uploading to Google Play

When submitting the tenant's first build to Play Console:

1. Go to **Setup > App signing** in Play Console.
2. Google Play will manage the **app signing key** (Google generates this).
3. Upload your **upload key certificate** (extracted from the keystore):
   ```bash
   keytool -exportcert \
     -alias upload \
     -keystore "keystores/<tenant-id>-upload.jks" \
     -rfc \
     -file "<tenant-id>-upload-cert.pem"
   ```
4. Upload the `.pem` to Play Console.
5. Delete the `.pem` from disk after upload (it's derivable from the keystore).

---

### Secure storage policy

#### What goes in the vault

For **each tenant** with production credentials, store:

| Item | Vault entry name | Example |
|------|-----------------|---------|
| Keystore password | `mbg-mobile/<tenant-id>/android-keystore-password` | `k8$jF2...` |
| Key alias | `mbg-mobile/<tenant-id>/android-key-alias` | `upload` |
| Apple Team ID | `mbg-mobile/<tenant-id>/apple-team-id` | `ABC123DEF` |
| App Store Connect API key | `mbg-mobile/<tenant-id>/asc-api-key` | `.p8` file contents |

Use **1Password**, **AWS Secrets Manager**, or another team-accessible vault. The specific tool doesn't matter — what matters is:

- At least two team members can access every entry.
- Entries are tagged with the tenant ID for searchability.
- Passwords are never stored in Slack, email, notes apps, or local files.

#### What goes in EAS

EAS stores credentials server-side after you run `eas credentials`. This is the primary credential store for CI/CD — builds pull from EAS automatically. The vault serves as the **backup and source of truth** in case EAS credentials need to be re-uploaded.

#### What stays local (temporarily)

- `.jks` files in `keystores/` during generation. After uploading to EAS and storing the password in the vault, you may delete local copies. The `.gitignore` prevents accidental commits regardless.

---

### Rotation & recovery

#### Scenario: forgot keystore password (not yet on Play Console)

This is the current situation. Since the keystore was never uploaded to Play Console:

1. Delete the old keystore: `rm keystores/upload-keystore.jks`
2. Generate a new one: `npm run generate:keystore -- <tenant-id>`
3. Store the password in the vault.
4. Register with EAS: `eas credentials --platform android`
5. No Play Console action needed — the old key was never associated.

#### Scenario: forgot keystore password (already on Play Console)

If the upload key has been submitted to Google Play and you've lost the password:

1. You **cannot recover** the password. The keystore is unusable.
2. Go to Play Console > **Setup > App signing**.
3. Click **Request upload key reset**.
4. Google will email the account owner with instructions (typically takes 48-72 hours).
5. Generate a new keystore (same process as above).
6. Upload the new upload key certificate to Play Console when prompted.
7. Update EAS credentials: `eas credentials --platform android`
8. Store the new password in the vault.

**During the reset window, you cannot publish updates.** Plan accordingly.

#### Scenario: rotating a keystore proactively

Even without a lost password, rotate upload keys periodically (annually recommended):

1. Generate a new keystore with a new alias suffix (e.g., `upload-2027`).
2. Request upload key reset in Play Console.
3. After approval, upload the new certificate.
4. Update EAS credentials.
5. Update the vault.
6. Archive (don't delete) the old keystore entry in the vault for 90 days, then remove.

---

### iOS credential management

iOS credentials are simpler with EAS because Expo can manage them end-to-end.

#### EAS-managed (recommended)

For most tenants, let EAS handle everything:

```bash
APP_TENANT=<tenant-id> NATIVE_ID_MODE=tenant \
  eas credentials --platform ios
```

Select **Let EAS manage credentials**. EAS will:
- Create a distribution certificate (or reuse an existing one).
- Create a provisioning profile for the tenant's bundle ID.
- Store everything server-side.

#### Self-managed (enterprise clients)

If a client requires their own Apple Developer account:

1. Client provides: Team ID, distribution certificate (`.p12`), and password.
2. Store certificate password in vault under `mbg-mobile/<tenant-id>/ios-dist-cert-password`.
3. Upload via `eas credentials --platform ios`.
4. Store the `.p12` in the vault (not on disk).

---

### Credential checklist for new tenants

When onboarding a new tenant for production:

- [ ] Dedicated Expo project created (see project isolation docs)
- [ ] Project ID added to `scripts/tenantProjects.ts`
- [ ] Android keystore generated: `npm run generate:keystore -- <tenant-id>`
- [ ] Keystore password stored in vault
- [ ] Keystore registered with EAS: `eas credentials --platform android`
- [ ] iOS credentials configured via EAS: `eas credentials --platform ios`
- [ ] First production build tested: `eas build --profile production --platform all`

---

### Emergency contacts & escalation

- **EAS credential issues:** [expo.dev/support](https://expo.dev/support) or Expo Discord
- **Play Console upload key reset:** Play Console Help > Contact support (48-72hr SLA)
- **Apple certificate revocation:** Apple Developer portal > Certificates > Revoke & regenerate
