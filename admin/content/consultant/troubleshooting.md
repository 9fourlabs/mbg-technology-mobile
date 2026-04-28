# Troubleshooting

**TL;DR.** The top issues you'll hit, ranked by frequency, with specific fixes. If none apply, ping engineering with the tenant ID, what you clicked, and the exact error text (or a screenshot).

---

## 1. "Invalid login credentials" when logging in

**Almost always:** wrong password or Caps Lock. Retype carefully.

**If you're sure the password is right:** ask the MBG admin to rotate your password from Supabase Dashboard → Authentication → Users → your row → Reset password. New password goes into 1Password (MBG vault → "Admin Portal - yourname@...").

**If your role is wrong (you log in but see no tenants):** your JWT needs a refresh. Sign out fully, close the browser tab, re-open, log in. If still empty, engineering needs to check your row in `tenant_users` and your `app_metadata.role`.

---

## 2. Changes I saved don't show up in the app

**Did you save AND publish?**

- `Save Draft` persists your edits to the portal but does NOT ship them to users.
- You have to explicitly click `Publish Update (OTA)` (for content/design changes) or `Save & Build` / `Builds → Preview` (for changes needing a rebuild).

**Did you publish to the right channel?**

- `Preview` updates only reach preview-build installers (you, the client, testers).
- `Production` updates reach store-installed users.

**Still not showing up?**

1. Give it 30–60 seconds — OTA propagation isn't instant.
2. Close + reopen the app (not just background + foreground — full close).
3. On iOS: force-quit from the app switcher.
4. On Android: swipe up from bottom or home-press + swipe away.
5. Re-open. Changes should be live.

**OTA was published but the app says it's running the old version:**

- Make sure your OTA was published to the matching channel of the build you're testing. `Preview` channel won't push to a production build and vice versa.
- Check the build's channel on **Builds** → click the build → look for "Channel: preview" or similar.

---

## 3. Preview build failed

Look at the build card in **Builds**. Expand the failure to see the log.

**Common causes:**

- **EAS free-tier quota exhausted.** MBG has a monthly build minute allowance. If over, you'll see "This account has used its builds from the Free plan this month." Wait for reset (monthly) or upgrade plan. Engineering decision.
- **Tenant config invalid.** Someone edited the raw JSON and introduced a syntax error, or a required field is missing. Go to **Config → Advanced** — the validator will highlight the issue.
- **Missing asset.** An icon or splash image URL in the config is broken / 404. Check the Assets tab; re-upload.
- **Credential not set up.** Most common on first-time-per-tenant builds. Engineering needs to run `eas credentials` for the tenant. See [Store Submission](../STORE_SUBMISSION.md) (engineering doc).

---

## 4. Production build / submission failed

Same categories as preview, plus:

- **App Store Connect listing doesn't exist yet.** Before the first iOS production submission, engineering creates the ASC listing. If that hasn't happened, submit fails.
- **Play Console listing doesn't exist yet.** Same for Android.
- **Apple Developer certificate expired.** Engineering rotates.
- **Bundle ID / package name mismatch.** If the client's listing has a different bundle ID than the tenant config, submit fails. Don't fix yourself — engineering investigates first.
- **Apple review rejected.** Check App Store Connect → Resolution Center. Common: missing privacy policy URL, screenshots wrong size, app crashes on their test device. Each rejection has specific guidance; work through it and resubmit.

---

## 5. Preview APK won't install on Android

User opened the link but the install button fails.

- **"Install from unknown sources" disabled.** Android blocks non-Play APKs by default. User must go to phone Settings → Security → enable "Install unknown apps" for their browser, then retry.
- **Browser downloaded the file but user didn't open it.** Some Androids leave the download silent. Tell user to open their Files app → Downloads → tap the `.apk` file.
- **Old version already installed.** If a previous preview is installed and the new one is signed with a different keystore, install fails with "App not installed". User must uninstall the old version first.

For iOS, preview builds go through TestFlight. User taps the TestFlight invite → taps "Install". If it fails:

- **User doesn't have a TestFlight invite.** Verify their email was added to the TestFlight testers list.
- **iOS version too old.** Our minimum is iOS 14 (Expo SDK 55 requirement). Rare in practice.

---

## 6. Push notification never arrives

Multiple layers of failure possible:

1. **Is push enabled in the tenant config?** Config → Features → Push notifications must be on.
2. **Was the build made after push was enabled?** Push is baked in at build time; earlier builds don't have the native module.
3. **Did the user grant permission?** First app launch after install prompts for push. User can decline, and we can't send them anything. They'd have to manually enable in phone Settings → App → Notifications.
4. **Is the user's phone reachable?** Offline phones get push on next network connect (if within APNs/FCM TTL, ~24–48h).
5. **Did the push actually send?** Tenant → Notifications tab shows history. If "Sent 0, Failed X" — auth problem with APNs/FCM. Engineering investigates.

Quick test: **send a push to yourself first** (install the preview on your own phone, give permission, send a test push from the portal). If you don't get it, the problem is platform-side, not user-side.

---

## 7. Client says their analytics show zero

See [Analytics Explained → Troubleshooting](./analytics-explained.md#troubleshooting-analytics).

Quick version: the app might not actually be used (check installs in the store consoles), might be crashing (check Sentry), or the admin portal's Supabase might be unreachable from the app (extremely rare).

---

## 8. The admin portal itself is down / slow

- **Mild slowness:** Fly.io free tier auto-sleeps idle machines. First request after 5+ minutes idle takes 5–10 seconds to wake; subsequent requests are fast.
- **Hard down (error page / white screen):** check https://status.fly.io and https://status.supabase.com. If both green and portal is still broken, engineering on-call.
- **Can log in but pages show "Failed to load":** usually a transient Supabase issue. Refresh in 30 seconds.

---

## 9. A client says "my app broke after the last update"

**Isolate first.** Is the breakage on one specific phone, or many? If one phone:

- Different iOS / Android version than before?
- Device storage full (Android apps sometimes fail silently)?
- Old app version still cached?

If many phones:

- **Check Sentry** (error tracking) for recent crashes since the update.
- **Check preview install of the same build** on your own phone — does it reproduce?
- **Roll back** via OTA: publish a new OTA containing the previous (known-good) config. Users recover on next launch.

Then fix forward.

---

## 10. "I need to change the tenant's slug / package name"

You can't, not safely.

- Package names are baked into the app. Users with an installed copy have an app tied to `com.9fourlabs.mbg.oldslug`. Changing the slug breaks their ability to receive updates.
- Bundle IDs (iOS) have the same issue.
- App Store / Play Store listings are keyed by these IDs. Changing means creating a new listing from scratch + losing reviews, ratings, analytics.

If it's a mistake that must be fixed:

- **Before first production submission:** fine, just create a new tenant with the right slug and migrate the config.
- **After production submission but few users:** have a conversation with the client about a clean reset — new slug, new listing, lose their (few) existing install's continuity.
- **After production with many users:** don't change. Name/label changes stay as visible tenant name; the technical ID stays wrong forever. Callers see a normal app name; it only shows up weird in URL-scheme handlers and store metadata.

---

## Escalating to engineering

When you ping engineering, include:

- **Tenant ID / slug** (e.g., `acme-dental`).
- **What you tried to do** (e.g., "publish OTA preview").
- **What happened** (e.g., "got an error saying 'Failed to upload update'").
- **Full text of the error** or a screenshot showing the error.
- **Timestamp** (approximately when).
- **Whether a retry succeeded or kept failing.**

Tickets with "it doesn't work" get de-prioritized. Tickets with the above list get solved fast.

---

## Emergency contacts

- **Production app broken (live users affected):** MBG admin (or engineering on-call) via your team's on-call channel.
- **Admin portal down:** same.
- **Apple rejected a submission on a launch day:** don't panic — rejections come with specific fixes. See Resolution Center in App Store Connect; resubmit after fixing.
- **Data breach suspected:** engineering + compliance leads immediately. Do NOT try to investigate first.
