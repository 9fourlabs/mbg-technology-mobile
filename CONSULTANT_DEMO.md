# MBG Platform — Demo & Consultant Onboarding

> This doc is for **MBG leadership** (Tim + anyone onboarding the next consultant). It covers the demo flow for prospective clients and the checklist for getting a new consultant productive on the platform. It does **not** cover the internal architecture — see [CLAUDE.md](./CLAUDE.md) for that — nor the guides consultants themselves use while working (those live in-portal under **Help & Guides**, source at [admin/content/consultant/](./admin/content/consultant/)).

---

## Table of contents

1. [What this platform is (elevator pitch)](#what-this-platform-is-elevator-pitch)
2. [Live demo — showing a prospect](#live-demo--showing-a-prospect)
3. [Onboarding a new consultant](#onboarding-a-new-consultant)
4. [Post-demo follow-up](#post-demo-follow-up)
5. [Appendix — where everything lives](#appendix--where-everything-lives)

---

## What this platform is (elevator pitch)

> "We build custom-branded mobile apps for small and growing businesses. Each client gets their own native app on the App Store and Google Play — with their branding, their content, and their own identity — not a white-label kiosk. Our consultants build these apps in our admin portal, without any code. An app that would take a dev shop 8 weeks to build and $20–40k to deliver, we can ship in 1–3 weeks starting around $X."

Three structural advantages to lead with:

1. **Real native apps, not WebView wrappers.** Each client ships a true app to their own Play/App Store listings. Their customers install it, their analytics are their own, their push notifications go to their customers.
2. **Consultants, not engineers, do the work.** The admin portal does everything — brand, design, content, store submission — from a web UI. No terminal, no code, no dev handoff.
3. **Updates in seconds, not release cycles.** Content edits push over the air to every installed app in seconds, no store review. Features that need a rebuild still ship same-day.

---

## Live demo — showing a prospect

Target: 30–45 minutes. Structure: problem → show → try → pricing → next step.

### 0 · Before the call (5 min prep)

- Make sure the admin portal is up: https://mbg-admin.fly.dev/login — sign in.
- Open the **MBG Technology** tenant in a tab — it's your reference app. Click through its **Config** tabs so they load in cache.
- If a prospect shared their business name or website, have it open in another tab to pull color / copy inspiration from during the call.

### 1 · The pitch (5 min)

Lead with the elevator pitch above. Then frame the value:

- "Most small businesses know they need an app but can't justify $30k + 8 weeks. We get that to ~$X and ~2 weeks because we built the machinery once and reuse it."
- "You don't need a dev team or an IT person. We handle the boring parts — signing certificates, store listings, push notifications. You focus on what the app says."
- "You own your app. If you ever want to leave us, you get the app."

### 2 · The walkthrough (15–20 min)

Open the admin portal on screen-share. Walk through in this order:

#### (a) **My Apps dashboard** — show the real MBG Technology tenant.
"This is our own app. Every client gets one of these rows. Green = Live, Blue = in Preview, Yellow = Draft."

#### (b) **Click into MBG → Config**.
Show the 5 tabs (Brand, Design, Pages, Features, App Store). Hover on the info icons (ⓘ) to show that every field has inline help for consultants.

"Every design choice a consultant makes has a short explanation right here. We've already made the hard choices once; the consultant just makes the client-specific ones."

#### (c) **Click into Design → Show preset switcher + live phone mockup**.
Flip presets (Modern / Classic / Minimal / Bold / Elegant). Show that the phone mockup on the right updates in real-time.

"We built 5 design systems for them. They pick the one that matches their brand, then tweak specifics. Most clients are configured in an afternoon."

#### (d) **Click Builds → show existing preview build**.
Point to the share link button and the Appetize.io embed.

"This is the killer feature for our sales motion. Every preview has a public share link. The prospect clicks it and sees their branded app running in their browser, immediately, no install, no account. They can send it to their partner, their marketing person, whoever — and they all see the same live app."

#### (e) **Open the share page in a new tab**.
If MBG has a built preview, this renders the Appetize embed. If not, show a past preview for a sample tenant.

"This is what your customers see when you send them the preview link."

#### (f) **Back to admin → click Help & Guides in the sidebar**.
Show the in-portal consultant guide — 10 guides, fully searchable, in-portal.

"This is every question a consultant would ask, answered. New consultants can onboard themselves in about an afternoon."

### 3 · Have them try it (10 min)

Give the prospect a one-off login to a demo tenant (or walk through as if creating one). Let them:

- Change a color in the Brand tab.
- Change a headline on the Home tab.
- Click **Publish Update (OTA)** → **Preview**.
- Reload the Appetize share link — their change is live in 10 seconds.

The moment when a non-technical prospect sees their text change reflected in a "real" app in real-time is the close.

### 4 · Pricing + what's next (5–10 min)

Have your pricing deck / proposal ready separately. Structure by template type:

- Informational (the simplest) — lowest tier, fastest timeline
- Authenticated / Content / Forms — mid tier
- Booking / Commerce / Loyalty — highest tier (more moving parts)

Plus ongoing: monthly retainer for OTA updates, Support tier for push campaigns, etc.

### 5 · Close

Always end with a **concrete next step**, not "let us know what you think":

- "If you're in, I'll send over the intake form tonight. Once you fill it out, we'll have your preview app ready in 2 weeks."
- "If you need to think about it, let's schedule a 15-minute follow-up next Tuesday and I'll answer any specifics."

---

## Onboarding a new consultant

Target: 1 workday to productive, 1 week to solo-closing clients.

### Day 0 — before they start (MBG admin does this)

- [ ] Create their email account (if they're getting a `@mbgtechnology.com` or similar).
- [ ] Add them as a user in the admin Supabase:
  - https://supabase.com/dashboard/project/wmckytfxlcxzhzduttvv/auth/users
  - Invite user → they get a magic-link email to set a password.
  - Give them `app_metadata.role = "admin"` so they can see all tenants.
- [ ] Send them this section of the doc + the login URL.

### Day 1 — orientation (the consultant does this)

- [ ] Log in at https://mbg-admin.fly.dev.
- [ ] Read **Help & Guides → Getting Started** (10 min).
- [ ] Read **Help & Guides → Glossary** (5 min).
- [ ] Read **Help & Guides → Choosing a Template** (15 min).
- [ ] Read **Help & Guides → Onboarding a Client** (30 min — most important).
- [ ] **Do the exercise at the bottom** — create a "demo" tenant in Draft status, configure it end-to-end using a fictional business. Have a senior consultant review.

### Week 1 — shadowing (pair with senior)

- [ ] Sit in on 2 client intake calls (observe only).
- [ ] Configure 1 tenant start-to-finish with a senior reviewing each step.
- [ ] Lead 1 client check-in meeting with a senior on the call.
- [ ] Publish 1 OTA update (content change) to a live client's preview.
- [ ] Read all the remaining in-portal guides (**Configuring an App**, **Content and Updates**, **Sending Push**, **Analytics Explained**, **Troubleshooting**).

### Week 2+ — solo, with escalation

- Run intake calls solo.
- Configure tenants solo.
- Escalate for first-time-per-tenant submissions (store listings need MBG admin for Apple / Play).
- Escalate for any engineering-flagged issue.

### Things a consultant should NEVER do

- Rotate passwords in 1Password without telling MBG admin.
- Commit directly to the repo (if they have access) — they shouldn't.
- Make changes in the Supabase dashboard directly — the portal abstracts this for a reason.
- Promise a client a feature that's not in one of the 8 templates — always check with engineering first.

---

## Post-demo follow-up

Three scenarios, pick the right template.

### Prospect said yes

1. Send intake form + contract within 24 hours.
2. Once signed, create the tenant in the portal (**My Apps → New App**).
3. Kick off per-consultant-doc onboarding ([admin/content/consultant/onboarding-a-client.md](./admin/content/consultant/onboarding-a-client.md)).
4. First preview build within 1 week of signed contract.

### Prospect said "need to think"

1. Send a recap email within 4 hours while the demo is fresh.
2. Include: the demo-tenant's Appetize link for them to re-share internally.
3. Propose a specific 15-min follow-up on their calendar.

### Prospect said no

1. Ask what changed their mind — "was it scope, timeline, price, fit?"
2. If price: offer a down-scoped template (move to informational if they wanted content).
3. If scope: flag for engineering ("hey, got a near-miss — they needed X which we don't have").
4. If fit: nothing wrong, just not the right match. Note it in your CRM for future reference — sometimes they come back in 6 months.

---

## Appendix — where everything lives

### Documents (for humans)

| Audience | Document | Location |
|----------|----------|----------|
| **Leadership / sales** | This file | [CONSULTANT_DEMO.md](./CONSULTANT_DEMO.md) |
| **Engineers** | Full architecture + SOPs | [CLAUDE.md](./CLAUDE.md) + [docs/](./docs/) |
| **Consultants** | In-portal guides | https://mbg-admin.fly.dev/docs (source: [admin/content/consultant/](./admin/content/consultant/)) |

### Surfaces (for clients + consultants)

| Surface | URL | Who uses it |
|---------|-----|-------------|
| Admin portal (MBG internal) | https://mbg-admin.fly.dev/login | MBG consultants + admins |
| Client portal (per client) | https://mbg-admin.fly.dev/client/login | Client owners — analytics, content, notifications |
| Consultant guides | https://mbg-admin.fly.dev/docs | Consultants (in-portal after login) |
| Tenant share page | https://mbg-admin.fly.dev/share/{tenant} | Prospects + clients (public, no login) |
| App Store listings | per client | End users (app consumers) |

### Secrets (all in 1Password → **MBG** vault)

Never paste any of these anywhere except in 1Password. The admin portal + Fly + GitHub have the ones they need already set via `op inject` / `op read`.

| Item | What it's for |
|------|--------------|
| `MBG Admin Supabase` | Portal's own database (cross-tenant) |
| `Supabase PAT` | Provisioning per-tenant Supabase projects |
| `Expo` | Triggering builds via EAS |
| `GitHub - mbg-mobile` | Dispatching build workflows |
| `Apple Developer` | iOS submissions (pending D-U-N-S approval) |
| `Google Play SA` + `FCM SA` | Android submissions + push |
| `Android Upload Keystore - mbg` | Android signing — **IRREPLACEABLE** once apps ship to Play |
| `ADMIN_BUILD_LINK_SECRET` | HMAC for build-share URLs |

### The platform stack (one-liner per piece)

- **Mobile runtime:** Expo SDK 55 + React Native 0.83 + React 19.2. One codebase, 8 built-in templates.
- **Admin portal:** Next.js 16 + React 19 + Preline UI. Runs on Fly.io (`mbg-admin.fly.dev`).
- **Build infrastructure:** EAS (Expo Application Services) for cloud builds + EAS Update for OTAs.
- **Database:** Supabase, per-tenant for content + one central admin DB.
- **Signing:** Android keystores in 1P + on EAS; iOS via ASC API keys (pending Apple Dev approval).

---

## Quick links for reference

- Repo: https://github.com/9fourlabs/mbg-technology-mobile
- Admin portal: https://mbg-admin.fly.dev
- Fly app dashboard: https://fly.io/apps/mbg-admin
- Expo org: https://expo.dev/accounts/ninefour-labs
- Central Supabase: https://supabase.com/dashboard/project/wmckytfxlcxzhzduttvv
- Internal docs: [docs/](./docs/) — for engineering
