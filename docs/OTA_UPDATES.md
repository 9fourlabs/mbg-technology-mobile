## OTA Updates (EAS Update)

Fast-path for shipping JS and content changes to existing installs — no rebuild, no App Store review, delivered in seconds.

Use OTA when:
- Changing tenant content (tab copy, card text, images referenced by URL)
- Fixing a JS bug
- Tweaking theme tokens or layout
- Iterating in front of a client

You **cannot** use OTA for:
- Adding or upgrading a native module (e.g. a new plugin in `app.config.ts`)
- Changing the bundle identifier / package name
- Changing app icon, splash screen assets, or other native config
- Any change that bumps the `runtimeVersion` fingerprint

If you're unsure, EAS will tell you at `eas update` time: if the fingerprint changed, the update won't apply to existing builds and you'll see a warning.

---

### How it's wired

- **`runtimeVersion: { policy: "fingerprint" }`** in `app.config.ts` — the runtime version is a hash of all native dependencies and config. Any native change auto-invalidates and requires a new build.
- **`updates.url`** points at `https://u.expo.dev/<projectId>` — Expo's hosted update service.
- **Build-time `--channel`** flag marks each build with a channel name. Builds only receive updates published to branches mapped to their channel.

### Channel / branch strategy

| Environment | Expo project | Build channel | Update branch |
|-------------|-------------|---------------|---------------|
| Preview | **Shared** across tenants (`8f0869f4-...`) | `preview-<tenant>` | `preview-<tenant>` |
| Production | **Per-tenant** (see `scripts/tenantProjects.ts`) | `production` | `production` |

Preview isolation is done by naming: `preview-acme-dental` is independent of `preview-smith-law`. Production isolation is done by project: each tenant has its own Expo project, so the `production` channel/branch inside it is inherently scoped.

---

### Publishing an update

**Local (one-off):**

```bash
npm run ota:preview -- --tenant acme-dental --message "Fix hero copy"
npm run ota:production -- --tenant acme-dental --message "Fix typo on services tab" --platform ios
```

**From CI (GitHub):**

1. Go to **Actions → EAS OTA Update**.
2. Click **Run workflow**, fill in tenant + environment + message, submit.
3. The workflow runs `.eas/workflows/ota-tenant.yml` which runs `eas update` with the right channel/branch/project.

**From EAS directly (if you know what you're doing):**

```bash
APP_TENANT=acme-dental eas update \
  --branch preview-acme-dental \
  --message "..." \
  --non-interactive
```

---

### Checking the update landed

- **EAS dashboard:** `https://expo.dev/accounts/ninefour-labs/projects/<project>/updates` — you'll see the new update and which branch / runtime version it targets.
- **On device:** close and reopen the app. `checkAutomatically: "ON_LOAD"` is set in `app.config.ts`, so the update downloads on cold start. The first launch after the update is published will *apply* the update on the next reopen (standard Expo OTA behavior).

If an update isn't showing up on device:
1. Confirm the build's channel matches the publish branch (`eas build:view <build-id>`).
2. Confirm the build's runtime version matches the update's (shown in dashboard). If different → native config drifted; you need a new build.
3. Check `Updates.isUpdateAvailable` / `Updates.fetchUpdateAsync()` at runtime if you need in-app debug.

---

### When to rebuild vs. OTA

Decision tree:

```
Did you touch app.config.ts plugins, native deps in package.json,
or any ios/ / android/ folder?
  ├─ Yes → full rebuild (eas-preview.yml / eas-promote.yml)
  └─ No  → OTA (eas-ota.yml) — seconds, not minutes
```

---

### Rollback

Every update has an ID. To roll back:

```bash
eas update:rollback --branch preview-acme-dental
```

Or republish an older commit's code as a new update — whichever the on-call engineer finds clearer.

---

### Caveats

- **Embedded update on first launch:** a fresh install bundles the update from the time the build was created. It takes one cold start *after* the first launch to pick up any OTA updates published since.
- **iOS App Store guideline 4.3:** you can change content and logic via OTA, but you cannot introduce net-new features that weren't in the reviewed binary. Keep OTA scope to fixes and content.
- **Android Play Store:** no equivalent rule, but treat it symmetrically.
