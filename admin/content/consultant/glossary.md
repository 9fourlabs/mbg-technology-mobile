# Glossary

Quick reference for the jargon you'll hear. If you're reading another guide and hit a term you don't know, check here first.

## Platform terms

**Tenant** — One client's app. Each tenant has its own name, branding, template, content, and eventually its own listing on the App Store / Play Store. "Acme Dental" is a tenant; the MBG Technology app is a tenant; your next client will be a tenant. Everything in the admin portal is organized per-tenant.

**Template** — The app's skeleton. Eight built-in types (informational, authenticated, booking, commerce, loyalty, content, forms, directory) plus a "custom" path for bespoke clients. The template decides what features the app has; the tenant config decides how it looks and what it says.

**Admin portal** — The web app you log into at `mbg-admin.fly.dev` to manage everything. Two sides to it: the **MBG admin** side (you — managing all tenants) and the **client** side (clients log in at `/client/login` to see just their own tenant's analytics + content).

**Native app / mobile app** — The actual iOS or Android app the client's customers install. Built from the tenant config, distributed through TestFlight/internal-track for previews, and through the App Store / Play Store for production.

## Lifecycle terms

**Draft** — A tenant whose config exists but hasn't been built yet. Safe to edit freely. Badge color: yellow.

**Preview** — A tenant with a live internal build that you can install on a test device. Client-reviewable before launch. Badge color: blue.

**Production** ("Live") — A tenant whose app is published on the App Store and/or Play Store. Customers can download it. Badge color: green.

**Build** — The process of turning a tenant config into an actual installable `.apk` (Android) or `.ipa` (iOS) file. Takes 10–20 minutes per platform.

**Submission** — Uploading a production build to the App Store / Play Store for review. Apple review is 1–3 days typically; Google review is usually same-day.

## Update terms

**OTA update** (Over-the-Air) — A way to push content changes to already-installed apps without a new build or store review. Takes seconds. Works for JS/content changes, not for adding new features that need native code.

**Channel** — The OTA "delivery lane" an installed app listens to. `preview-<tenant>` feeds preview builds; `production` feeds store-released apps. When you publish an OTA, you pick the channel.

**Rebuild** — A fresh native build. Needed when you change the template type, add/remove features, or change app store metadata. OTA won't deliver those — only a rebuild plus a new store submission will.

## Branding terms

**Brand config** — Logo URL, primary color, background color, text colors. The "always on" visual identity.

**Design preset** — Picks a whole look at once (Modern / Classic / Minimal / Bold / Elegant). You can tweak individual settings after.

**Adaptive icon** (Android only) — Modern Android shows the app icon on top of a colored circle/square that varies by phone model. You supply foreground + background images; the OS composites them.

**Splash screen** — The first image shown when the app launches while it loads. Usually the logo on a brand-color background.

## Store terms

**Bundle ID** (iOS) / **Package name** (Android) — A unique string that identifies the app in the stores. Example: `com.9fourlabs.mbg.app`. Cannot be changed after first store submission.

**Keystore** (Android) — A cryptographic signing key. Google Play pins it to your app on first upload — lose it and you need a support ticket to reset. Stored in 1Password and on EAS.

**Provisioning profile** (iOS) — Apple's equivalent of signing. Managed automatically by EAS after the first build.

**App Store Connect API key** — Lets EAS submit iOS builds to Apple without typing an Apple ID. A `.p8` file stored in 1Password.

**Play service account** — Same idea as the ASC API key, but for Android. A JSON file stored in 1Password.

## Infrastructure terms

**EAS** (Expo Application Services) — The cloud service that compiles builds, stores signing credentials, and runs OTA distribution. You don't need to log in there directly — the admin portal talks to it on your behalf.

**Supabase** — The database + auth layer. MBG has a central Supabase project for the portal itself; each tenant that needs content (CMS-style apps) gets its own Supabase project.

**Fly.io** — Where the admin portal runs. If the portal is down, it's usually a Fly issue.

**1Password** — The vault for every secret on this project. "MBG" vault contains keystore passwords, API keys, service accounts.
