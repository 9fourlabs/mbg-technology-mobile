# Choosing a Template

**TL;DR.** MBG has 8 built-in templates plus a "custom" path for clients who need something bespoke. Pick the template during tenant creation — you can change it while in Draft status but not after the first production build goes out. Use the decision tree below, then skim the matching template's section for examples.

---

## The 2-minute decision tree

```
Does the client need users to log in?
├─ No → informational
└─ Yes → What do their users do while logged in?
        ├─ Book appointments (haircut, spa, doctor)       → booking
        ├─ Buy products (coffee shop, merch store)        → commerce
        ├─ Earn rewards / collect stamps                  → loyalty
        ├─ Read posts / news / articles                   → content
        ├─ Submit forms (orders, feedback, intake)        → forms
        ├─ Browse a list of things (menu, catalog, staff) → directory
        └─ Just see a personalized dashboard              → authenticated
```

If none of those fit, you're probably in **custom** territory — talk to engineering. Custom clients bring their own Expo repo and plug into the same build pipeline, but they're not driven by this template system.

---

## The 8 templates

### 1. Informational

**Best for:** service businesses, consultancies, portfolios, law firms, restaurants (non-ordering), contractors. Anything where the app is a brochure/hub, not a transactional tool.

**What the client gets:** a tabbed app with branded content cards. Each tab is one topic (Home, Services, Plans, Contact, About, etc.) with scrollable cards. Each card can have an image, title, body text, and a button that opens a URL (call, book a meeting, write a review).

**MBG Technology's own app uses this template** — that's the reference example. Look at `configs/tenants/mbg.json` for a real config.

**Setup time:** 1–2 hours of config work for a straightforward client.

**Doesn't do:** login, push unless you enable it explicitly, content updates by the client (you update via the portal), any data collection, payments.

### 2. Authenticated

**Best for:** member-only apps where the core value is post-login access to a personal dashboard / profile / account page. Think fitness clubs, coaching programs, B2B tools.

**What the client gets:** all the informational features, plus Supabase-backed email/password login. After login, certain tabs can be gated ("protected tabs" in the config). You can mark any subset of tabs as requiring auth.

**Setup time:** 2–3 hours including provisioning the tenant's Supabase project and configuring login screens.

**You'll need to:** provision a per-tenant Supabase project (engineering handles this on first setup), then plug its URL + anon key into the tenant config.

### 3. Booking

**Best for:** service businesses where users schedule appointments — salons, spas, medical offices, personal trainers, music lessons, restaurant reservations.

**What the client gets:** everything in Authenticated, plus a services list (with prices and duration), business hours, a slot picker calendar, and a "My Bookings" tab. Users log in, pick a service, pick a time, and get confirmation.

**Config includes:** list of services (id, name, duration, price, description), business hours per weekday (start/end times), slot duration in minutes, max advance-booking days, cancellation policy text.

**Setup time:** 3–4 hours — most of the time is in entering services + hours accurately.

### 4. Commerce

**Best for:** small retail businesses, local restaurants with delivery, merch stores. Uses Stripe for payments.

**What the client gets:** authenticated, plus product catalog (with categories + images), cart, checkout via Stripe, order history. Shipping and tax are optional; tax rate is a single percentage.

**Config includes:** Stripe publishable key, currency code, store name, categories list, shipping on/off, optional tax rate. The actual product list is separate (see [Content and Updates](./content-and-updates.md)).

**You'll need:** the client to set up a Stripe account and give you the publishable key. This takes them 15–30 minutes.

**Setup time:** 4–6 hours including Stripe onboarding + initial catalog.

### 5. Loyalty

**Best for:** cafes, barber shops, nail salons, local businesses that want a "buy 9 get 1 free" punch card but fancier.

**What the client gets:** authenticated, plus a points balance, a rewards catalog (earn X points, redeem for Y reward), and a check-in/purchase flow to earn points. Often combined with a QR code the business scans at checkout.

**Config includes:** point earning rules (points per dollar, per check-in, per referral), rewards list, sign-up bonus.

**Setup time:** 3–4 hours.

### 6. Content

**Best for:** blogs, news apps, podcasts, publications. Anything where the app is a feed of posts/episodes.

**What the client gets:** authenticated (optional), plus a posts feed with categories, post detail view, search, and a tenant-side CMS (in the admin portal under the **Content** tab) where the client can write/edit posts themselves.

**This is the one template where the client self-manages ongoing content.** You set it up once; they publish forever.

**Setup time:** 2–3 hours for initial setup + training the client on the CMS.

### 7. Forms

**Best for:** lead gen, intake forms, feedback collection, job applications, quote requests.

**What the client gets:** a library of forms you define (one per use case), each with typed fields. Submissions land in the tenant's Supabase database; client sees submissions in the portal under **Content**.

**Config includes:** each form's field schema (text / number / select / checkbox / date), required flags, submission notification settings (optional email to client when a submission comes in).

**Setup time:** 2–3 hours per client, more if they have many complex forms.

### 8. Directory

**Best for:** team rosters, restaurant menus, real estate listings, event speaker lists, service provider directories.

**What the client gets:** a browsable list of items (people / menu items / listings) with filter + search + detail pages. Items are entries in the tenant's Supabase; client manages them in **Content**.

**Config includes:** schema for each item (fields like name, photo, role, tags, price, location), filter/sort defaults, how the list card looks.

**Setup time:** 2–3 hours, largely in designing the item schema.

---

## Reference examples in this repo

Every template has a working sample tenant you can open in the admin portal to see how the config is structured:

- `mbg` — informational (the real MBG Technology app)
- `acme-portal` — authenticated (stub)
- `sample-booking` — booking
- `sample-commerce` — commerce
- `sample-loyalty` — loyalty
- `sample-content` — content
- `sample-forms` — forms
- `sample-directory` — directory

Load any sample in the portal, flip through its **Config** tab, and use it as a starting point when you're configuring a real client.

## Can you change templates later?

- **While the tenant is still Draft:** yes, freely. Nothing has shipped yet.
- **After the first preview build:** yes but you'll need to rebuild.
- **After submitting to the App Store / Play Store:** effectively no. Changing template types means a rebuild AND a new store submission AND a big UX change for any user who already installed. Avoid.

## Next

[Onboarding a Client](./onboarding-a-client.md) walks through actually using the template you picked, from the client intake to the first preview build.
