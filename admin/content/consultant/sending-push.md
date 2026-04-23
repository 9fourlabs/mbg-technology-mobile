# Sending Push Notifications

**TL;DR.** Go to the tenant home page → **Send Notification**. Write a short title + body. It goes to every user who installed the app AND granted push permission. Most common mistakes: sending too often, sending at the wrong time zone, treating it like email. Cadence matters more than content.

---

## When to send a push

**Good reasons:**

- Booking confirmations / appointment reminders (transactional, expected).
- Commerce order updates, shipping notices, delivery notifications.
- Time-sensitive content the user asked to be notified about.
- A real promotion with a deadline ("Happy hour ends in 2 hours").
- Breaking news on a news template.

**Bad reasons:**

- "We haven't sent one in a while."
- Generic "check out our app!" messages.
- Birthday marketing unless it's truly personalized.
- Anything your user would've read in an email.

**Push notifications interrupt people.** Use that power sparingly or users disable pushes — which means you can never reach them again for the good reasons.

## Setup prerequisites

Push is off by default per tenant. To enable:

1. **Config → Features → Push notifications** — toggle on.
2. This triggers a rebuild requirement (native module is included only when push is on).
3. iOS apps need the push entitlement on the provisioning profile — engineering handles this on first setup per tenant.
4. Next rebuild will bake in push support.
5. Users who install the new build get a permission prompt on first launch. They can say yes or no. If they say no, you can't send them anything — their choice.

Preview builds can send pushes if push is enabled + the preview build was made after toggling push on.

## How to send a one-off push

1. Tenant home page → **Send Notification** button (top-right, visible only when push is enabled).
2. Fill out:
   - **Title** — the first line the user sees on their lock screen. Max ~50 characters.
   - **Body** — more detail, 1–2 short sentences. Max ~150 characters.
   - **Link** (optional) — a URL to open in the app when tapped. Leave blank to just open the app.
3. **Preview** the notification — check it looks right on both iOS and Android mockups.
4. **Send.**

It takes seconds to deliver. Check the Analytics tab for delivery statistics.

### Title-writing checklist

- **Specific beats generic.** "Your 2pm appointment is in 1 hour" > "Appointment reminder".
- **Verbs first if possible.** "Check your new order" > "Your new order is ready".
- **Skip emojis** unless your brand is playful and it fits. One emoji max.
- **No ALL CAPS.** Feels spammy.

### Body-writing checklist

- 1 sentence, maybe 2. Users read on a lock screen, not in an inbox.
- If there's a call-to-action, lead with it.
- Include only info the user needs right now. Put details on the destination screen.

---

## Cadence guide

| Template | Recommended max |
|----------|----------------|
| Informational | 1–2 per month |
| Booking | Per-appointment (confirmations + reminders) + 1 general per month |
| Commerce | Per-order (confirm, ship, deliver) + promos max 2x/month |
| Loyalty | Milestone-based (earned reward, expiring points) — avoid calendar-based |
| Content | Breaking news + weekly digest at most |
| Forms | Per-submission to the client's email, NOT user pushes unless there's a specific reply workflow |
| Directory | Rarely — when featured content or new listings matter |

Clients push back on "only 1–2 per month" — they want engagement. Your job is to explain that push is a trust battery and every notification either charges or drains it.

**A data point for clients:** industry stats show push opt-in rates drop from ~60% to ~30% after the first "bad push". It's often not reversible.

## Scheduling + segmenting

Currently the portal only supports **one-off, send-to-all** pushes. No scheduling, no per-user targeting, no A/B testing. If a client needs any of those, it's a feature request — add to the backlog.

Workaround for scheduled pushes: set a calendar reminder to send it yourself at the right time. Annoying but works.

## Time zones

Pushes send **immediately** — they land in each user's time zone based on when their phone receives them. If you send at 11am EST and a user is in PST, they get it at 8am PST. If they're in Tokyo, they get it at midnight.

If the client has geographically spread users, send at a time that's reasonable everywhere (10am–6pm in the majority-user time zone, avoid sending before 8am or after 9pm).

## Platforms + deliverability

**iOS** — delivered via Apple's APNs. Reliable. User must have granted permission. If they disabled pushes in iOS Settings, you can't reach them.

**Android** — delivered via Google's FCM. Reliable. Permission is requested since Android 13 (before that, push was on by default). Same story if user disables: gone.

Expo's push API handles both platforms in one request. You don't pick platform in the portal.

**No delivery guarantees** for any push. Typical delivery rates are 95–99% within seconds. Causes of failure:
- User's phone offline (gets delivered when they reconnect if still within APNs/FCM TTL).
- Phone in power-saver / do-not-disturb.
- Token expired (if user hasn't opened the app in weeks, their push token may have expired — next app open will re-register).

## Viewing push history + stats

Portal → Tenant home → **Notifications** tab → shows recent pushes with delivered count, failed count, and timestamps.

Interpret stats carefully:

- **Delivered** = sent to APNs/FCM successfully. Not the same as "seen".
- **Failed** = typically expired tokens. Normal rate is 1–5% of audience.
- **No open/tap stats currently.** That's a future feature.

## When push isn't working

See [Troubleshooting → push not delivering](./troubleshooting.md).

Common causes:

- Tenant hasn't been rebuilt since enabling push.
- User denied permission at first launch (no way to re-prompt from your side — they have to turn on in iOS/Android Settings themselves).
- FCM credentials expired on EAS (engineering rotates).
- APNs key expired (engineering rotates).

## Policy & law stuff

- **GDPR / privacy:** pushes are personalized communication. Include an opt-out path in your privacy policy. Users can also disable at the OS level.
- **CAN-SPAM / TCPA don't apply** to push notifications (they apply to email / SMS).
- **Country-specific rules:** in some markets (South Korea's KISA, China's various regs) push has tighter requirements. If client targets those markets, discuss with engineering.

## Next

- [Analytics Explained](./analytics-explained.md) — reading the numbers, including push metrics.
