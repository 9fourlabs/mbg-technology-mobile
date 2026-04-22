# Roadmap

Living list of planned enhancements we've consciously deferred, with the reason they're not in today's scope and a rough trigger for when to revisit. Keep it tight — if it's not something we'll actually do, don't list it.

---

## Share-page improvements

### Embedded in-browser preview (Appetize iframe)

**What:** The `/share/[tenantId]` page currently links out to Appetize via a "Launch browser preview" button in a new tab. We want an embedded iframe so prospects stay on the MBG-branded share page while playing with the app. See [admin/src/app/share/[tenantId]/share-page-client.tsx](admin/src/app/share/[tenantId]/share-page-client.tsx) — the `NOTE:` comment above the "Try it now" block.

**Why deferred:** Appetize iframes are a paid feature (Starter tier at ~$40/mo+). On the free tier the iframe renders a plan-upgrade notice. The link-out flow works today without extra cost.

**Trigger to revisit:** Either (a) when MBG has its first paying client closing on the back of the demo flow — embed UX then pays for itself, or (b) when monthly active share-page views hit a threshold that makes the $40 trivial.

**Implementation:** Upgrade Appetize to Starter at https://appetize.io/account → swap the button back to an `<iframe src={https://appetize.io/embed/<key>...}>`. Roughly a 15-line revert.

---

## Ideas worth tracking (no dates)

- **Scheduled push notifications** — today's portal only supports send-to-all-immediately. Clients who want drip campaigns or timed announcements are asking. Adds a `scheduled_pushes` table + a cron worker.
- **Per-user / segmented push targeting** — same surface, stronger targeting. Needs user attributes or tags on `push_tokens`.
- **First-run onboarding tour in the admin portal** — after "Help & Guides" landed in-portal, a guided walkthrough on first login would cut consultant ramp time from ~1 day to ~2 hours. Needs a tour library (Shepherd.js, Driver.js) or custom popover primitives.
- **Cloudflare Images migration** — zero-egress image hosting + automatic resize/format conversion. Worth the switch when image storage egress hits a meaningful line on the bill or when ~100 tenants are live (whichever comes first).
- **Custom tenant-scoped authorization on the upload API** — today any authenticated user can upload assets to any tenant's folder. Low-risk with a small, trusted consultant team; worth hardening before expanding team access.
- **Retention + DAU/MAU analytics** — clients frequently ask for these metrics. We have the raw events; need to aggregate + display.
- **Multi-language / i18n support for tenant content** — clients with bilingual markets (hospitality, local services in diverse regions) have asked.
- **Client-self-serve content updates** — Content / Forms / Directory templates already support this. Extending a light CMS-style edit surface to the Informational template (so a client can edit their own cards without a consultant) would unlock a higher ARR tier.
