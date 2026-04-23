# Content and Updates

**TL;DR.** Two update mechanisms. **OTA** for content + design + copy changes — seconds to deploy, no store review. **Rebuild** for feature changes + icon/splash/name changes + template changes — 15–30 minutes + up to 3 days store review. Default to OTA; rebuild only when you must.

---

## The mental model

Every app has two layers:

1. **Native shell** — the compiled iOS/Android binary. Contains the app icon, splash screen, bundle ID, and the React Native runtime. Changing this requires a rebuild + store submission.

2. **JavaScript bundle + assets** — the actual screens, content, styling, logic. This is what OTA updates replace.

When a user opens an installed app, the runtime checks for a new JS bundle. If one is available, it downloads it in the background and applies on next launch. Result: content changes go live in seconds, no App Store / Play Store review needed.

## What goes where

### OTA (Over-the-Air) — use for:

✓ Card text, headlines, descriptions, copy
✓ Card images (swap the `imageUri` URL to a new image)
✓ Button labels, URLs, colors
✓ Design preset changes (Modern → Classic etc.)
✓ Card style / layout / button shape / typography sizes
✓ Adding / removing / reordering tabs (within the existing template)
✓ Adding / removing / reordering cards within tabs
✓ Commerce product catalog updates (if your storefront reads from Supabase, even more direct — see below)
✓ Booking services list, hours, slot duration changes
✓ Content (posts, directory entries, forms) when served from Supabase
✓ Stripe key swaps (test → live, or key rotation)
✓ Supabase URL / anon key rotations (rare, but OTA-capable)

### Rebuild — you must rebuild for:

✗ App name change (the name shown under the icon)
✗ App icon change (foreground / background images)
✗ Splash screen image change
✗ Adaptive icon background color (Android)
✗ Template type change (informational → authenticated etc.)
✗ Turning push notifications on/off
✗ Adding / removing native modules (normally engineering-driven)
✗ iOS bundle ID or Android package name change (should never happen post-launch)
✗ App Store description / keywords / category changes (these live in the store, not in the app — actually these don't need a rebuild, just a metadata-only store resubmission)

### Special case: upgrading the app's minimum OS version

Rare; engineering handles when it comes up. Requires rebuild + careful thought about users on older phones who lose support.

---

## How to publish an OTA

In the admin portal:

1. Make your edits in **Config → Pages / Design / Brand / etc.**
2. Click **Save Draft** on the tab.
3. Head to the tenant home page.
4. Click **Publish Update (OTA)** button.
5. Pick the channel — **Preview** if you're testing, **Production** if this is going to shipped users.
6. Write a short message describing the change ("Fixed typo in hero", "New photo on Services tab"). This shows up in the build history for future audit.
7. Publish.

Within 30–60 seconds, the update is live. Users' installed apps will pick it up:

- Apps currently open → on next navigation tick.
- Apps currently closed → on next launch (the user opens the app → update downloads → applies after a brief loading flash).

Clients love this. Use it.

### Previewing before production

**Always OTA to Preview first**, verify the changes look right on a preview build / Appetize embed, then OTA to Production.

Steps:

1. Save edits.
2. Click **Publish Update (OTA) → Preview**.
3. Refresh the preview build / Appetize embed — change is live.
4. Client reviews. They say "looks good".
5. Click **Publish Update (OTA) → Production**.

Production users see the change on their next app open.

---

## How to rebuild

When you must rebuild, go to **Builds → Preview** (to test) or **Builds → Production** (to submit to stores).

Preview rebuild:
1. Click Preview.
2. Wait 10–15 min for Android, 15–20 min for iOS.
3. New install URL + Appetize embed appears.
4. Test the change on device.

Production rebuild + submission:
1. Click Production.
2. Android build + auto-submit to Play Internal track: ~20 min.
3. iOS build + auto-submit to TestFlight: ~25 min.
4. Promote to public via Play Console / App Store Connect when ready (or, if auto-submit is configured, this happens automatically).

Store review adds 0–3 days. Apple is slower than Google.

---

## Tenant-side CMS content (for Content / Forms / Directory templates)

Templates backed by Supabase have their own edit flow that doesn't require OTA OR rebuild — the app reads live from Supabase at runtime.

If the client is using the **Content** template (blog/news):
- They (or you) log into the admin portal's **Content** tab.
- Add/edit/delete posts.
- Changes are live on installed apps within ~10 seconds (as soon as the mobile client's next network fetch hits).

Same applies for **Forms** (submissions land in Supabase for client review) and **Directory** (entries served live).

This is the fastest update mechanism of all. Train content-heavy clients on the **Content** tab during handoff so they can self-serve.

---

## When an OTA bricks the app (rare, but worth knowing)

If a bad OTA crashes the app on launch, users are stuck. Expo has safety nets:

- The app keeps the last-working JS bundle on device. If the new bundle fails to load, it falls back.
- You can push a new OTA immediately to fix. Users on the broken version will get the fix on next launch.

**Avoid bricks by:**

- Always OTAing to Preview first.
- Checking the app actually opens on a real device (or Appetize) after the update.
- Not rushing production OTAs late on Fridays.

## What if I want to pause OTA updates?

Sometimes you're making a bunch of draft edits but don't want clients seeing them. The admin portal keeps **draft** configs separate from published ones — `Save Draft` doesn't publish. You have to explicitly click **Publish Update (OTA)** to broadcast.

There's no "pause OTA delivery" switch on the client side. Once you publish, it ships to the channel. If you need to roll back, publish a new OTA with the old content.

## Versioning

Every OTA publish bumps an internal version number. Store-submitted builds have their own versioning. The admin portal's **Builds** tab shows both.

Rule of thumb: if a client calls and says "my app version says 1.0.2 but the store says 1.0", they're confusing OTA version with native version. Explain: the native shell is what the store shows; what's inside that shell is what OTA updates. Both can differ; that's okay.

## Next

- [Sending Push Notifications](./sending-push.md)
- [Troubleshooting](./troubleshooting.md) — what to do when an update doesn't show up.
