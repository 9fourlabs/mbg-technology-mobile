# Consultant Guide

Welcome. This section of the docs is written for **MBG consultants** — the people who actually sit with clients, build their apps in the portal, and help them ship to the app stores. No engineering background needed.

If you're a developer looking for internal architecture docs, head back up one level to [../](../) for the technical SOPs (SETUP, KEYSTORE_SOP, OTA_UPDATES, etc.).

## Read this first (the 15-minute onramp)

1. [Getting Started](./getting-started.md) — log in, take the dashboard tour, understand what you're looking at.
2. [Glossary](./glossary.md) — 20 terms you'll hear all the time (tenant, preview, OTA, channel, production…). Bookmark this.
3. [Choosing a Template](./choosing-a-template.md) — 8 built-in template types. Which fits which client.

## Daily workflow

4. [Onboarding a Client](./onboarding-a-client.md) — start-to-finish: intake → tenant creation → config → preview → client approval → launch. The single most important guide in this section.
5. [Configuring an App](./configuring-an-app.md) — every field in the Brand / Design / Pages / Features / App Store tabs, in plain English.
6. [Content and Updates](./content-and-updates.md) — when to OTA (minutes) vs. when to rebuild (hours). How to push a change.
7. [Sending Push Notifications](./sending-push.md) — best practices, cadence, what to avoid.

## Reporting back to clients

8. [Analytics Explained](./analytics-explained.md) — what the numbers mean, how to narrate them on a check-in call.

## When things go wrong

9. [Troubleshooting](./troubleshooting.md) — top 10 problems and how to handle them.

---

## How these docs are structured

Each guide starts with a **TL;DR** at the top so you don't have to read all of it. Then walkthroughs with real examples. Then a reference section at the bottom if the guide covers anything schema-heavy.

When a guide refers to a specific button or page in the admin portal, it says so: "click **Builds → Preview**" means open the Builds tab, then click the Preview button. That notation maps exactly to what you'll see on screen.

## Who to ask

- **Portal broken or error you don't recognize?** Check [Troubleshooting](./troubleshooting.md) first, then ping engineering.
- **Client's app looks wrong but portal says it shipped?** Check [Content and Updates](./content-and-updates.md) — most of these are OTA-rollout timing, not bugs.
- **Need to submit to the App Store / Play Store?** [Onboarding a Client](./onboarding-a-client.md) covers the submission flow start to finish.
