# Onboarding a Client

**TL;DR.** Six steps. Expect 1–2 weeks total for a simple informational app, 3–4 weeks for commerce/booking/content apps.

```
1. Intake call        (1 hour)      — collect brief + assets
2. Create the tenant  (30 min)      — portal: My Apps → New App
3. Configure          (2–6 hours)   — brand, pages, features, store meta
4. Preview build      (30 min + waits) — buildable APK/TestFlight
5. Client review      (1–2 weeks)   — feedback, iterate, re-preview
6. Production ship    (1–7 days)    — store submission, approval, launch
```

Each step below has a checklist.

---

## Step 1 — Intake call

Goal: collect everything you need so you're not chasing the client for assets for two weeks.

### Must-have

- [ ] Business name (exact name for store listings).
- [ ] Primary brand color (hex preferred — ask for their website or a Figma file if they don't know).
- [ ] Logo — ideally a 1024×1024 PNG with transparent background. If all they have is a JPG from their website, that's okay as a starting point.
- [ ] One-paragraph description of what the business does (for store listing).
- [ ] Who opens the app, and what do they do first? (This decides your template — see [Choosing a Template](./choosing-a-template.md).)
- [ ] Existing website URL (for "open link" buttons in informational templates).
- [ ] Who's the decision-maker? The business owner or their marketer? Set expectations: the owner approves the final app, the marketer probably writes copy.

### Nice-to-have (don't let it block you if they don't have it)

- [ ] Splash screen artwork (usually just the logo centered).
- [ ] Secondary / accent color.
- [ ] Photos they'd like to use for content cards (Unsplash works as placeholders).
- [ ] Social media / booking / payment URLs if using those features.
- [ ] Tagline / keywords for app store search.

### For booking / commerce / loyalty clients, also collect

- [ ] Services or products list with prices, duration, descriptions.
- [ ] Business hours.
- [ ] Stripe account (if commerce — they set up; you collect the publishable key).
- [ ] Loyalty rules (if loyalty) — points per dollar, redemption thresholds, rewards.

### For authenticated / content / forms clients, also collect

- [ ] Do they want users to sign up themselves, or will they invite members?
- [ ] Who manages content after launch — you or them?

**Red flags** — if you hear any of these, slow down before you create the tenant:

- "Can the app do X?" where X is not in the template you picked. Don't promise — check with engineering.
- "We want to look like [big app]." Fine as inspiration; don't commit to pixel-matching.
- "Can it work offline / integrate with our Salesforce / send SMS / do video chat?" Not out of the box. Engineering scope discussion.

## Step 2 — Create the tenant

In the admin portal:

1. **My Apps → New App** (top-right button).
2. You'll get a 6-step wizard. Fill each step — the wizard is well-guided, just follow prompts.
3. Pick the template (see [Choosing a Template](./choosing-a-template.md)).
4. Give the tenant a slug — lowercase, hyphens only, no spaces. Example: `acme-dental`. This becomes part of URLs and build identifiers and **cannot be changed later**. Pick carefully.
5. Submit.

You'll land on the tenant's home page with the tenant in **Draft** status.

### Tips for picking the slug

- Use the client's business name, but short and unambiguous.
- No special characters, no emojis, no underscores (use hyphens).
- Examples: `acme-dental` ✓, `bobs-burgers` ✓, `acme` ✓, `Acme Dental LLC` ✗, `acme_dental` ✗.
- If there could be multiple clients with similar names, include something differentiating — `acme-dental-chicago`, not just `acme-dental`.

## Step 3 — Configure

Open the tenant's home page and head to **Config**. Five tabs.

Do them in this order:

1. **Brand** — logo URL, primary color, background color, text colors. This is the visual foundation.
2. **Design** — pick a preset (Modern / Classic / Minimal / Bold / Elegant), then fine-tune. See [Configuring an App](./configuring-an-app.md) for what each field does.
3. **Pages** — add tabs and cards. Each tab needs a label + headline + description. Each card needs image, title, body, and optionally a button.
4. **Features** — template-specific switches (push notifications, auth, booking services, etc.).
5. **App Store** — the name, description, and keywords that appear on the App Store / Play Store listing. Fill now even if not shipping to stores — you'll need it.

**Save early, save often.** Each tab has a Save Draft button. Don't wait until everything's perfect.

### Upload assets

Go to **Assets** and upload:

- **App icon** — 1024×1024 PNG, no transparency, no rounded corners (the OS rounds them).
- **Splash icon** — 1024×1024 PNG, logo centered on transparent or brand-colored background.
- **Android adaptive icon foreground** — 512×512 PNG with the logo centered, leaving ~200px safe zone around edges.
- **Android adaptive icon background** — 512×512 PNG for the backdrop. Usually a solid brand color or gradient.
- **Favicon** — 48×48 PNG (for web fallback).

If the client doesn't have these ready, use their primary color as a solid background and their logo as the foreground. "Good enough" for preview; polish before store submission.

## Step 4 — Preview build

Go to **Builds** and click **Preview**.

- Android preview takes ~10 minutes to build. When done, you get a `.apk` download URL and an Appetize.io web preview link.
- iOS preview takes ~15 minutes and goes to TestFlight via the shared preview Expo project. Users invited to TestFlight install the preview app.

While it's building you can do other things. The Builds tab will show progress.

**Send the preview to the client**:

1. Grab the **Share Link** (copy button on the build card). This is a tenant-branded page that shows the Appetize.io embed + download buttons.
2. Send it to the client. They click the link → see the app running in their browser immediately (Appetize) → can install on a real phone if they want (APK for Android, TestFlight for iOS).

No QR codes to scan, no account creation, no special app needed. This is the #1 tool in your sales + review motion.

## Step 5 — Client review

Budget 1–2 weeks. Clients take longer than you expect to review.

### Managing feedback rounds

- **Content-only changes** (copy tweaks, different photo, button label) → edit in Config, click **Publish Update (OTA)**. Client sees changes in seconds. No rebuild needed.
- **Design / layout changes** (preset, card style, button shape) → same as above, OTA works.
- **Template-level changes** (wanting to add a login feature to an informational template) → rebuild needed, 15–30 min.
- **Icon / splash / app store metadata changes** → rebuild needed (native assets are baked into the build).

Use OTA whenever possible. It's seconds vs. minutes and clients love the immediacy.

### When the client approves

Get their approval in writing (email, DocuSign, whatever your standard is). Include:

- Version approved (build number / commit hash from the Builds tab).
- What they're approving for — preview-only, or production ship.
- Any outstanding items they've chosen to ship without (e.g., "content migration to happen post-launch").

## Step 6 — Production ship

Once approved, the client needs **developer accounts** in Apple + Google:

### Apple
- Client signs up for an **Apple Developer Program** account ($99/year). [Signup flow](https://developer.apple.com/programs/enroll/).
- They need a D-U-N-S number if they're an LLC/corp — free to get at [dnb.com](https://www.dnb.com/duns-number/get-a-duns.html), takes 1–3 days.
- Approval of the dev account takes 1–2 weeks for organizations. Individual ("sole proprietor") accounts are faster, ~1–2 days.

### Google
- Client signs up for a **Google Play Console** account ($25 one-time). [Signup flow](https://play.google.com/console/signup).
- Organization accounts need a D-U-N-S number too, same as Apple.
- Approval usually same-day; sometimes ~2 days.

### After the developer accounts are approved

1. Client invites you (or the MBG team) as a developer on both consoles.
2. You create a draft app listing in each console (screenshots, descriptions, privacy policy URL, content rating). This takes 1–2 hours per store.
3. Back in MBG admin portal → the tenant's **Builds** tab → click **Production**. This kicks off a production build AND auto-submits to whichever stores you've enabled in the client's tenant config.
4. Apple review: typically 24–48 hours, sometimes up to 3 days for first submissions.
5. Google review: usually same day, sometimes 1–2 days.
6. When approved, the client's app is live. Tell them, celebrate.

### Before you ship, also do

- [ ] Update the tenant's **App Store** config tab with final name, description, keywords.
- [ ] Rotate the iOS provisioning profile if this is a push-enabled app (engineering handles).
- [ ] Verify push notifications actually work (engineering handles first-time setup per tenant).
- [ ] Run the client through how **they** update their app after launch — OTA for content, rebuild for features. See [Content and Updates](./content-and-updates.md).
- [ ] Walk the client through their **client portal login** at `/client/login` — this is where they'll see analytics, send pushes, and (if applicable) manage content. See [Getting Started](./getting-started.md) — section on client portal.

## Common timeline

Simple informational app, client is responsive:

| Week | What happens |
|------|-------------|
| 1 | Intake, tenant created, config drafted, first preview built |
| 2 | Client reviews, 1–2 rounds of tweaks, final preview approved |
| 3 | Apple/Google dev accounts provisioned (if client didn't have), production build submitted |
| 4 | Apps approved and live on both stores |

Commerce/booking adds 1–2 weeks for content entry + Stripe setup.
