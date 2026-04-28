## Push Notifications

End-to-end procedure for enabling push notifications on a tenant's app.

Push is **off by default** — the `expo-notifications` plugin is gated on the `EXPO_PUSH_ENABLED` env var. This is because once the plugin is enabled, every iOS build requires a provisioning profile with the Push Notifications capability, and we don't want to break preview builds for tenants that haven't set that up yet.

---

### Architecture (the 30-second version)

```
┌──────────┐  POST /api/tenants/<id>/notifications/register   ┌──────────────┐
│  Mobile  │ ───────────────────────────────────────────────► │ Admin (Next) │
│   app    │                                                  │              │
└──────────┘                                                  │  push_tokens │
                                                              │   (admin DB) │
                                                              └──────┬───────┘
                                                                     │
                                                                     ▼
                                                              ┌──────────────┐
┌──────────┐  POST /api/tenants/<id>/notifications/send       │ Expo Push    │
│  Client  │ ───────────────────────────────────────────────► │ Service      │
│  portal  │                                                  │ (exp.host)   │
└──────────┘                                                  └──────────────┘
                                                                     │
                                                                     ▼
                                                          fan-out to APNs / FCM
```

- `expo-notifications` registers the device for native push and obtains an **Expo push token**.
- The mobile app POSTs that token to the admin portal, which stores it in `push_tokens`.
- When the client sends a notification from the portal, the admin POSTs the message to Expo's push API, which fans out to APNs (iOS) and FCM (Android).
- We don't talk to APNs or FCM directly — Expo handles that — but Expo needs the right credentials at the **build/registration** layer so devices can receive push at all.

---

### One-time setup (per Apple Developer / Google account)

#### Apple

1. **Apple Developer portal → Certificates, IDs & Profiles → Keys → +** and create an **APNs** key. Download the `.p8` (one-time download). Store in 1Password under `mbg-mobile/shared/apple-push-key.p8`.
2. Note the **Key ID** and your **Team ID**.
3. Upload to EAS:

   ```bash
   eas credentials
   # iOS → production → Push Notifications → Set up Push Notifications
   # → Provide existing key, paste .p8, Key ID, Team ID
   ```

   EAS uses this key to register devices with APNs at build time and (more importantly) configures it on Expo's servers so the Expo push service can talk to APNs on your behalf.

#### Google (FCM)

1. **Firebase console → your project → Project Settings → Service accounts → Generate new private key.** Download the JSON. (If you don't have a Firebase project, create one and link your Android app to it via the package name `com.9fourlabs.mbg.<tenant>`.)
2. Store in 1Password under `mbg-mobile/shared/fcm-service-account.json`.
3. Upload to EAS:

   ```bash
   eas credentials
   # Android → production → FCM V1 service account → Upload
   ```

---

### Per-tenant setup

For each tenant whose app needs push:

1. **iOS App ID → enable Push Notifications capability** (Apple Developer portal → Identifiers → click the App ID → Capabilities → check Push Notifications → Save).
2. **Regenerate the iOS provisioning profile** so it includes the new entitlement:

   ```bash
   APP_TENANT=<tenant> NATIVE_ID_MODE=tenant \
     eas credentials --platform ios
   # Select "Build credentials" → "All: Set up build credentials" and let
   # EAS regenerate the profile from scratch.
   ```

3. **Toggle push on for this tenant** in the admin portal:
   Tenant → Config → App Store tab → **Enable push notifications**. This
   sets `appStore.pushEnabled = true` in the tenant config. The
   `trigger-build` API reads it and passes `push_enabled=1` through to the
   workflow chain (GitHub → `.eas/workflows/*-tenant.yml`), which sets
   `EXPO_PUSH_ENABLED=1` in the build env, which makes `app.config.ts`
   include the `expo-notifications` plugin in *that* build.

   Tenants without `pushEnabled=true` build without the plugin — so toggling
   one tenant on doesn't break the others.

4. **Trigger a fresh build** for the tenant (`eas-promote.yml` for production, `eas-preview.yml` for preview). The new binary will include the native module and request notification permission on first launch.

---

### Sending a notification

From the **client portal**: `/client/<tenant>/notifications` → fill in title + message → click Send. The portal POSTs to `POST /api/tenants/<tenant>/notifications/send`, which:

1. Authorizes the user (admin or owner of the tenant).
2. Reads all `push_tokens` for the tenant.
3. Batches into groups of 100 and POSTs to `https://exp.host/--/api/v2/push/send`.
4. Reports back `{ sent, failed, total }`.

From **server-side code** (e.g. cron, automated triggers):

```ts
await fetch("https://admin.mbgtechnology.com/api/tenants/acme-dental/notifications/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Cookie: "<admin session cookie>",
  },
  body: JSON.stringify({
    title: "Doors open at 6 PM",
    body: "RSVP via the Events tab.",
  }),
});
```

(Programmatic / unattended sends should use a service-account auth scheme — not yet implemented. For now, the portal UI is the supported path.)

---

### Mobile-side wiring

`src/hooks/usePushNotifications.ts` does the registration:

1. Lazily imports `expo-notifications` and `expo-device` so builds without the plugin still load.
2. On mount, requests permission, fetches the Expo push token, and POSTs it to `${adminUrl}/api/tenants/${tenant}/notifications/register`.
3. Subscribes to foreground notifications and exposes them via `notification`.

The hook is safe to call from any tenant/template — when the plugin is absent, it returns `permissionStatus: "unavailable"` and does nothing.

`adminUrl` comes from `app.config.ts` extras, defaulting to `https://admin.mbgtechnology.com`. Override locally with `EXPO_PUBLIC_ADMIN_URL=http://localhost:3000 npm run start`.

---

### Common errors

**"Push notifications haven't been registered with this Expo project."** The build was created without the plugin. Rebuild after setting `EXPO_PUSH_ENABLED=1`.

**"Provisioning profile doesn't include the aps-environment entitlement."** The iOS provisioning profile predates the push capability. Regenerate (step 2 above).

**"DeviceNotRegistered" tickets in the send response.** The user uninstalled the app or rejected push permission. The token will keep returning DeviceNotRegistered — periodically clean these up:

```sql
DELETE FROM push_tokens WHERE updated_at < now() - interval '90 days';
```

**Mobile app never POSTs the token.** Check:
- `Constants.expoConfig.extra.adminUrl` is set (look at `expo config --type public`).
- The `Info.plist` shows `UIBackgroundModes` includes `remote-notification` (the plugin should set this).
- The build was created with the plugin (`expo-notifications` should appear in the build's modules list on EAS).
