# Getting Started

**TL;DR.** Log in at `mbg-admin.fly.dev/login` with the email and password MBG issued you. First screen is **My Apps** — a list of every tenant (client app) on the platform. Click an app to manage it. The sidebar has the five places you'll go: My Apps, Recent Builds, Analytics, Settings, and Help (that's this).

---

## Your first login

1. Open **https://mbg-admin.fly.dev/login** in Chrome, Safari, or any modern browser.
2. Email = the one MBG added you with. Password = whatever you set up on first account creation. If you've never logged in, ask the MBG admin to send you a password reset.
3. If login says "Invalid login credentials" — 99% of the time it's a typo or Caps Lock. If you're sure it isn't, reach out to the MBG admin to rotate your password.

After login you land on the **My Apps** dashboard.

## The sidebar (left edge)

Five items. Top to bottom:

### My Apps
The list of every tenant on the platform. This is your home base. Click any row to drill into one app. At the top you'll see three status cards — **Draft**, **In Preview**, **Live** — that filter the list when clicked. See the [Glossary](./glossary.md) for what each status means.

Empty state (new accounts): You'll see a big card explaining the three-step onboarding. If you see this and have clients you're supposed to manage, something's wrong with your account permissions — ask the MBG admin.

### Recent Builds
A cross-tenant view of the last 30 or so builds across all tenants. Useful when you just kicked off a build and want to watch its status without navigating into the specific tenant.

### Analytics
Usage telemetry rolled up across all tenants. Number of events, top screens, active users. For an individual tenant's analytics, click into the tenant first — the per-tenant view is richer.

### Settings
Your account settings + a **Platform Health** panel showing which env vars are configured on the portal server (Supabase, EAS, GitHub, etc.). If any are red, engineering needs to know.

### Help
What you're reading right now. Linked to the consultant guides in this folder.

## The My Apps page — what you're looking at

Each tenant row shows:

- **Logo / initials** — the client's brand.
- **Name + app type** (Informational, Booking, Commerce, etc.).
- **Status pill** — Draft / In Preview / Live, color-coded.
- **Last updated** — when the config was last saved.
- **Build info** — whether a preview build is ready to install.

Click any row to go to that tenant's home page.

## The tenant home page

When you click into a tenant, you see five tabs at the top:

1. **Config** — edit the branding, design, pages, features, and store metadata. This is where 80% of your time goes.
2. **Content** — if the template supports a CMS (content, forms, directory templates), this is where you post / edit dynamic content.
3. **Assets** — upload logos, icons, splash images.
4. **Builds** — kick off preview and production builds, see their status, download the APK to test.
5. **Analytics** — per-tenant usage.

There's also a **Send Notification** button for tenants that have push enabled, and an **Advanced** link that exposes the raw JSON config for power users.

## Keyboard shortcuts

None currently. Add a request if you want some.

## Troubleshooting first-login issues

- **"Invalid login credentials"** — see above.
- **Landed on dashboard but My Apps is empty** — you may not have tenant permissions yet, OR your JWT is stale (sign out + back in forces a refresh).
- **Sidebar missing on mobile** — tap the hamburger (≡) icon top-left to open it.
- **Pages slow to load** — Fly.io's free tier sleeps inactive servers. First request after idle takes 5–10 seconds; subsequent requests are fast.

## Next step

Read [Choosing a Template](./choosing-a-template.md), then walk through [Onboarding a Client](./onboarding-a-client.md). Those two together are the minimum to be productive on the platform.
