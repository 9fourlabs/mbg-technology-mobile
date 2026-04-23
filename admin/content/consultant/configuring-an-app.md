# Configuring an App

**TL;DR.** Five tabs in the Config editor. This guide explains every field in plain English. The ones marked ⚠️ are the ones consultants most often set wrong.

---

## Tab 1 — Brand

The visual foundation. Every other design choice builds on these values.

### Logo
URL to your client's logo. Must be HTTPS and publicly reachable. PNG is preferred, JPG is acceptable. Transparent background looks cleanest.

- ✓ Use a URL from the client's website if they have one
- ✓ Upload to the **Assets** tab and paste the uploaded URL
- ✗ Don't use a URL that requires login (Google Drive share links often break)

### Primary color
The "brand color" — used for buttons, links, highlights throughout the app. Pick the client's most recognizable color (usually what's on their website logo or sign).

- Enter as a 6-digit hex like `#d4af37`.
- Not sure? Use a color picker on their website or pull from their brand guide.
- ⚠️ Avoid very light colors (pale blues, yellows) — they look washed out on dark backgrounds and illegible on light ones.

### Background color
The default surface color behind content. Most apps use white or very dark. Choose based on the client's vibe:

- Light background (`#FFFFFF`, `#F9FAFB`) — clean, professional, safe default.
- Dark background (`#000000`, `#0A0A0A`) — bold, luxury, tech-forward.

### Text color + muted text color
Primary text (headings, body) and secondary text (timestamps, subtitles).

- On light backgrounds: text `#111827` + muted `#6B7280`.
- On dark backgrounds: text `#FFFFFF` + muted `#999999`.
- ⚠️ Check contrast. Muted text on a dark background can become unreadable. The WCAG AA target is 4.5:1 contrast ratio — use a tool like https://colorable.jxnblk.com if unsure.

### Splash background color
The color behind the splash screen's logo while the app is loading. Usually the same as the main background color, but can differ (e.g., white app with a dark splash for brand punch).

---

## Tab 2 — Design

### Design preset
Pick one of 5. Each preset sets reasonable defaults for the rest of the tab. You can customize after applying.

| Preset | Vibe | Use for |
|--------|------|---------|
| **Modern** | Clean, rounded cards, 2-column layouts | SaaS, tech startups, modern services |
| **Classic** | Structured, sharp corners, single column | Law firms, financial advisors, traditional businesses |
| **Minimal** | Flat, small text, no embellishment | Design studios, photographers, zen |
| **Bold** | Big headings, rounded, 2 columns, bright | Fitness, cafes, youth-focused brands |
| **Elegant** | Refined, medium rounded, underline accents | Boutique hotels, salons, luxury goods |

Start with the preset closest to the client's vibe, then tweak.

### Card style
How content cards render.

- **Rounded** — 12–16px corner radius. Friendly, modern.
- **Sharp** — square corners. Structured, premium.
- **Flat** — minimal border, slight radius. Minimal, subdued.

### Card layout
- **List (1 column)** — one card per row. Use when cards have lots of body text, or for primary navigation-style content.
- **Grid (2 columns)** — two cards per row. Use when cards are short/visual (image + short title), or for browsable feeds.

⚠️ Don't switch mid-config unless your cards are consistent in length. 2-column grid with wildly different text lengths looks terrible.

### Button shape
Slider from Square (0px) to Pill (fully rounded). Most modern apps sit around 8–16px. Rounded corners feel friendlier; sharp corners feel more serious.

### Header style
The top-of-page heading alignment.

- **Left** — American/Western convention, feels structured. Reads first.
- **Centered** — more formal, ceremonial, luxury. Works well for single-column layouts.

### Tab bar style
The tab switcher at the bottom of most screens.

- **Pills** — rounded pill behind the active tab. Friendly, playful.
- **Underline** — a line under the active tab. Restrained, professional.

### Typography — heading size + body size
Three options each: Small / Medium / Large.

- **Heading Small** — compact, information-dense. Good for content-heavy apps.
- **Heading Medium** — default, balanced.
- **Heading Large** — billboard-style, dramatic. Only if the brand wants impact.
- Body sizes follow the same principle: small = info-dense, medium = default, large = accessibility-forward.

⚠️ Heading Large + Body Small together looks off-balance. If you pick one extreme, pick the matching extreme for the other.

---

## Tab 3 — Pages

Where the actual content lives. This is template-dependent — informational templates use tabs+cards; booking templates show services; content templates show a posts feed.

For the common case (informational/authenticated):

### Tabs
A list of tabs shown at the bottom of the app. Max 5 for usability (most apps stop at 3–4).

Each tab has:

- **ID** — a unique string (no spaces). Internal-only; user never sees it. Use short names like `home`, `services`, `contact`.
- **Label** — what the user sees in the tab bar. Keep to 1 word if possible — "Home", "Shop", "Menu" — 2 words max.
- **Header title** — the big headline shown at the top of the tab. Can be longer than the label.
- **Header body** — one or two sentences under the header, setting context.
- **Cards** — a list of content cards (see below).

### Cards (per tab)
Each card is a block of content with an optional action.

- **ID** — unique within the tab, like `hero`, `pricing-card`, `contact-form`.
- **Image URI** — URL to a card image. 1200x800 aspect works well. Optional.
- **Title** — the card's headline. Keep to 6 words or fewer.
- **Body** — short explanatory text. Supports line breaks using `\n`. Around 1–3 sentences max.
- **Action** — optional button.
  - **Type** — `open_url` (opens a URL in a browser / app) or `none` (no button).
  - **URL** — the destination. Must be HTTPS or a deep link (`mailto:`, `tel:`, `sms:` all work).
  - **Label** — the button text. "Book now", "Learn more", "Get started" etc.
  - **Variant** — `primary` (filled brand-color button) or `secondary` (outlined button). Use primary for the main call-to-action per tab; secondary for lesser options.

### Tips for writing cards

- **Headlines are benefit statements, not feature lists.** "Innovate. Integrate. Elevate." > "Technology Services".
- **Body text is short.** If it doesn't fit in 3 sentences, it's too long. Add more cards instead.
- **One primary CTA per tab.** Multiple primaries compete. Secondary buttons are fine.
- **Use consistent image styles.** Don't mix photography and illustration in the same tab.

---

## Tab 4 — Features

Template-specific. Covers push notifications, authentication, booking services, commerce categories, etc. Each template has its own set.

For every template, you'll see:

### Push notifications
- **Enabled** — master toggle. Off by default. Turning on triggers a rebuild requirement (native module needs to be included).
- Before you can send pushes, the mobile app must be built with push enabled AND users must grant permission when prompted.

### Authentication (non-informational templates)
- **Supabase URL** + **Supabase anon key** — identify the tenant's Supabase project. Provided by engineering during tenant provisioning. Don't type these by hand — copy-paste from the provisioning handoff doc.
- **Protected tabs** — list of tab IDs that require login. Unlisted tabs are public.
- **Sign-up enabled** — can users register themselves, or only sign in with pre-created accounts? Depends on client's model.

### Booking (booking template)
- **Services** — see [Choosing a Template](./choosing-a-template.md).
- **Business hours** — rows for each weekday. Times in 24-hour format (09:00, 17:30).
- **Slot duration** — default time slot in minutes (30 is most common, 15 for quick services, 60 for longer).
- **Max advance days** — how far out users can book. 30 = one month.
- **Cancellation policy** — plain-text paragraph shown before booking.

### Commerce (commerce template)
- **Stripe publishable key** — client's Stripe `pk_live_...` or `pk_test_...`. Can swap from test to live via OTA once they're ready.
- **Currency** — 3-letter code (`USD`, `EUR`, `GBP`). Lower-case won't work.
- **Store name** — shown at checkout.
- **Categories** — high-level product groupings (Drinks, Pastries, Merch).
- **Shipping** — toggle if they fulfill physical orders. Leaves checkout address entry visible.
- **Tax rate** — single decimal percentage (0.0825 for 8.25%). Leave blank if the client doesn't charge tax.

---

## Tab 5 — App Store

Critical for store submissions. Fill all fields even in Draft so you don't scramble later.

### App name
The name shown under the app icon on users' phones. Apple limits this to 30 characters. Google Play allows up to 50. Aim for something that fits in 25 or fewer so it doesn't truncate.

⚠️ Cannot include words like "free", "new", "best", "#1", or marketing language — both stores reject.

### App description
Play Store shows this prominently, Apple less so. 80 char short + 4000 char long, but consultants usually only need to write 100–300 words. Structure:

1. **Opening sentence** — what the app does, who it's for.
2. **Features list** — 3–6 bullet points.
3. **Closing call-to-action** — "Download now to...".

### App keywords
Apple-only (Play ignores this field). Comma-separated, up to 100 characters total. Think about what a user types into the App Store search bar to find this app:

- ✓ `"dentist, appointment, dental, booking, checkup"` (5 keywords, 41 chars)
- ✗ `"the best dental app for booking appointments"` — these are phrases, Apple wants keywords.

### Adaptive icon background color
Android-only. The color shown behind the foreground icon image on the launcher. Defaults to your brand color.

### Splash background color
Color shown behind the splash image while the app loads. Inherits from Brand tab if blank.

### Push enabled
Flips the master switch. Must also turn on Apple Developer push capability + rebuild. See the detailed flow in [Sending Push Notifications](./sending-push.md).

### iOS ASC App ID
Numeric ID from App Store Connect (e.g., `1234567890`). Added when the tenant's app listing is created in App Store Connect. Required for `eas submit` to iOS.

### Android package name
Optional override for the default. Leave blank unless engineering says otherwise — the default is derived from the tenant slug and works for 99% of cases.

---

## Advanced tab

Raw JSON editor for the full tenant config. Useful for:

- Power users doing bulk copy-edits.
- Engineering debugging schema issues.
- Copy-pasting config between tenants.

**Warning:** the JSON editor bypasses the visual validation you get in the other tabs. If you put malformed data here, the next build will fail. Use when you know what you're doing.

---

## Saving

Two save modes:

- **Save Draft** — persists the config without triggering a build. Safe to click every few edits.
- **Save & Build** — saves AND kicks off a preview build. Only click when you've got a meaningful chunk of changes ready to test on device.

If you save a change that's only a content tweak (card copy, button text), use **Save Draft** + **Publish OTA** from the tenant home page. Faster than rebuilding.

## Next

- [Content and Updates](./content-and-updates.md) — when edits need rebuilds vs OTA.
- [Troubleshooting](./troubleshooting.md) — common config errors and fixes.
