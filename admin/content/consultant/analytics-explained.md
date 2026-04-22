# Analytics Explained

**TL;DR.** Two analytics views. **Portal → Analytics** (MBG cross-tenant) shows everything. **Tenant → Analytics** (per-client) shows just that app. Metrics are event-based — every screen view and user action is logged as an "event". Below: what each metric means and how to talk about it with a client.

---

## Where the numbers come from

The mobile app sends events to the admin's Supabase whenever:

- A user opens a screen (event type: `screen_view`, with `screen_name`).
- A user taps certain tracked buttons (event type: `action`, with `action_name`).
- The app launches (event type: `app_open`).

Events land in a single table (`analytics_events`) with:

- `tenant_id` — which app
- `event_name` + `screen_name` + `action_name` — what happened
- `platform` — ios or android
- `created_at` — when
- `user_id` — if logged in (optional — anonymous events just have `null`)
- `session_id` — groups events from a single app open

No PII is collected by default — no names, no emails, no IP. If the client wants fancier tracking, that's a feature request, not a config option.

## What consultants see

### The per-tenant analytics page

In the client-facing view (what the client also sees at `/client/[tenantId]/analytics`):

1. **Events (last 30 days)** — total count of all events. Big number at top.
2. **Top screens** — top 5 most-viewed screens with view counts.
3. **Recent activity** — last 20 individual events with timestamp.

That's it for the v1 client view. It's intentionally simple — clients can look at the total and the top screens without needing a data science team.

### The cross-tenant analytics page (MBG-only)

At `/analytics` in the portal sidebar. Same metrics but rolled up across every tenant. Useful for:

- Knowing which clients have active apps vs ghost-installs.
- Comparing engagement across similar clients.
- Spotting a client whose app usage dropped suddenly (something broke, or they're churning).

---

## Reading each metric

### Events count
Raw count of everything that happened across the tenant in the last 30 days. Low numbers early are normal.

**Typical ranges** for a brand-new app (first 30 days after launch):

- **< 100 events** — the app exists but nobody's using it. Either install count is low, or users are downloading and abandoning. Both need attention.
- **100–1000 events** — small user base, normal engagement. Maybe 10–20 unique installs.
- **1000–10,000 events** — early traction. Dozens of users returning.
- **> 10,000 events** — strong engagement. Either lots of installs or engaged regulars.

⚠️ Don't promise specific numbers to clients. A dentist's app with 50 events / month but 100% of them from booking flows = great. A news app with 10,000 events but 90% bounce on the home screen = bad. Always ask WHAT the events are, not just HOW MANY.

### Top screens
Most-viewed screens. Directly maps to what users care about.

**How to interpret:**

- **Home screen is always #1** — that's where users land. Expected.
- **If the second place is the feature you most want used** (Booking, Contact, Products) — great, users are doing the core action.
- **If the second place is a completely different tab** — users are exploring but not engaging. Consider the UX of the core flow.
- **If the Home screen is 10x the next tab** — users are bouncing. Either the home screen isn't selling the app well, or the tabs aren't clearly labeled.

### Recent activity
Last 20 events, newest first. Mostly useful for spot-checks — "is anyone actually using this right now?" or "did that bug we just fixed unblock traffic?".

---

## How to present analytics to a client

**Framing matters.** Raw numbers aren't actionable — the story is.

### Monthly check-in template

> "Your app had {X} events last month from {Y} unique users. The most-viewed screen was {Z}, which means users are [doing what screen Z represents]. One thing we're watching: {something specific}. One thing we recommend: {small actionable tweak}."

Example for a dentist client:

> "Your app had 340 events in the last 30 days from about 40 unique users. The most-viewed screen after Home was 'Book Appointment', which means most of your patients are finding the booking flow fine. One thing we're watching: 12 users tapped the booking button but only 8 completed a booking — we should look at the booking calendar to see why 4 dropped off. One thing we recommend: add a 'why book through the app' card to your Home tab to convert more of the 40 users into active bookers."

### Clients who want numbers they shouldn't chase

- **DAU / MAU** — daily / monthly active users. We don't show this directly today (can derive from session data if someone asks). Informational apps rarely hit meaningful DAU; that's fine.
- **Retention** — what % of users come back after N days. We can compute; not shown in v1.
- **Conversion** — % of users who completed a target action. Depends on the client defining what the target is.

If the client asks for these, explain we can surface them as a custom analytics deliverable (future feature request). Don't shame them for asking — they've probably heard these terms from other SaaS products.

### Numbers NOT to share

- Individual `user_id` or `session_id` — privacy.
- `created_at` at second-level precision — doesn't help the client.
- Specific IP addresses, device IDs — we don't collect these, but if somehow asked, no.

---

## Common client questions

**Q: "How many people have my app installed?"**
A: We don't track installs directly — App Store Connect / Play Console show installs, not our portal. Events are a reasonable proxy. If the client wants exact install counts, walk them through their store console or take a screenshot once a month.

**Q: "Why did traffic drop this week?"**
A: Compare events week-over-week. Check: did something break (Troubleshooting), did the client's business slow down for seasonal reasons (summer for a school), or did a recent update to the app reduce usage (rare but possible).

**Q: "Can we do A/B testing?"**
A: Not today. Feature request.

**Q: "Can I see which users did X?"**
A: Not by default — we don't collect identifying data. If they need it (e.g., for a reward-fulfillment audit trail), it's a data-collection discussion that must factor in privacy regs.

**Q: "Can I export the data?"**
A: Yes — the admin portal has a CSV export button on the analytics page (feature pending in some versions). Otherwise engineering can run a one-off export.

---

## Troubleshooting analytics

### "My app's live but events = 0"

Check in this order:

1. **Is the app actually installed?** Check App Store Connect / Play Console install counts.
2. **Did users open it?** First open fires an `app_open` event. If installs > 0 but events = 0, users installed but never opened.
3. **Is analytics wired in the build?** Engineering check — rare, usually only an issue on custom-path tenants.
4. **Is the tenant's Supabase reachable?** Extremely rare — if the admin portal Supabase is up, this is too.

### "Events stopped coming in"

1. Most common cause: **the app itself is crashing on a recent build or OTA**. Users can't open it, so no events fire. Check crash reports (Sentry if wired) or try installing the preview yourself.
2. Supabase ingest endpoint down — visible on the settings/health page.
3. A platform-wide rate limit (never seen in practice but theoretically possible).

### "The numbers seem wrong"

- Check time zone: the portal shows times in UTC in some places, local in others. If a client says "we had an event at 3pm and it's not showing up," check whether the filter is in UTC or their zone.
- Duplicates are not filtered aggressively — if a user repeatedly taps a tab, that's multiple events. Not a bug.

## Next

- [Troubleshooting](./troubleshooting.md) — broader issue list.
