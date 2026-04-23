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

## Build pipeline hardening

### Per-tenant OTA channel isolation for preview builds

**What:** Preview builds currently share the channel `"preview"` (from `eas.json`'s preview profile). This was previously overridden per-tenant via `--channel "preview-<tenant>"` on the `eas build` CLI, but that flag was removed in current eas-cli — and the field in `eas.json` doesn't support env-var interpolation. So right now, a `publishOta.ts preview --tenant mbg` push to branch `preview-mbg` would NOT reach MBG preview builds (they listen on channel `preview`, not `preview-mbg`).

**Impact today:** Low — only one tenant (MBG) currently has a preview build. Everything lands on the same `preview` channel, which is fine in single-tenant mode.

**Impact once we have 2+ clients:** Client A's preview OTA would propagate to Client B's preview app, since they share the channel. Not acceptable.

**Fix options:**
- Generate a per-tenant `eas.json` on the fly in the EAS workflow before `eas build` runs (a short `jq` transform).
- Define per-tenant profiles in `eas.json` (`preview-mbg`, `preview-acme-dental`...) — scales poorly.
- Align the update-side: have `publishOta.ts preview` target branch `preview` (single branch) and accept no cross-tenant isolation for preview.

**Trigger to revisit:** Before we onboard a second paying client with active preview cycles.

### GitHub Actions should fail when its dispatched EAS workflow fails

**What:** Today, `.github/workflows/eas-preview.yml` calls `eas workflow:run ...` to fire an EAS workflow, then polls `eas build:list` every 30s for up to 20 minutes looking for a new FINISHED build. If the EAS workflow fails fast (e.g., the `eas-cli missing` bug we just fixed — 25s from dispatch to failure), the poll loop doesn't detect the failure. It times out, the GitHub Actions job still exits green, and subsequent logic can pick up a stale prior build and link it as the "new" one — exactly how the April 11 Bob's Burgers APK got linked to MBG in Appetize during this session. See commit `c48d566` context for the diagnosis.

**Why deferred:** Fixed the root-cause `eas-cli` bug first; polling reliability is a separate concern that needs more thought on how to detect EAS workflow failures without blocking on every build.

**Trigger to revisit:** Next time anything else in the EAS workflow fails fast and we get confusing downstream behavior.

**Implementation options:**
- Capture the EAS workflow run ID from `eas workflow:run` output, then poll `eas workflow:view <id>` (or its API) for FAILURE/SUCCESS before or alongside the existing `eas build:list` poll.
- Or fail the poll loop immediately if it doesn't see a new EAS build within ~60 seconds of dispatch — would correctly fail fast but also false-positive on slow queues.
- Preferred: detect via workflow-run status, not build-list polling.

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
