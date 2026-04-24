# Pocketbase Schemas

One JSON file per template type. `scripts/provisionPocketbase.ts` imports the
right one into a newly-provisioned PB instance.

| File | Template type | Source replaced |
|------|---------------|-----------------|
| `content.json`   | content   | `supabase/migrations/001_content.sql` |
| `directory.json` | directory | `supabase/migrations/002_directory.sql` |
| `forms.json`     | forms     | `supabase/migrations/003_forms.sql` |
| `loyalty.json`   | loyalty   | `supabase/migrations/004_loyalty.sql` |
| `booking.json`   | booking   | `supabase/migrations/005_booking.sql` |
| `commerce.json`  | commerce  | `supabase/migrations/006_commerce.sql` |
| `events.json`    | events    | `supabase/migrations/016_events.sql` |

`events` is an add-on applied on top of other templates that want a calendar.
The provisioning script accepts `--template` for the primary template and will
additionally seed `events.json` if the template config has `eventsEnabled`.

## Format

Each file is an array of PB collection definitions. PB's admin API accepts
these verbatim via `PUT /api/collections/import`. The `_pb_users_auth_`
collection ID refers to PB's built-in users collection — every instance has
it, created on first boot.

## Collection IDs

PB collection IDs must be 15 lowercase alphanumeric characters starting with
a letter. We use descriptive, stable, zero-padded IDs so cross-collection
relations resolve on import without needing a second pass:

| Collection | ID |
|---|---|
| `posts` | `posts_coll00001` |
| `bookmarks` | `bookmarks_col01` |
| `directory_items` | `directoryitems0` |
| `form_submissions` | `formsubmissions` |
| `loyalty_rewards` | `loyaltyrewards0` |
| `loyalty_accounts` | `loyaltyaccounts` |
| `loyalty_transactions` | `loyaltytransact` |
| `services` | `services0000000` |
| `time_slots` | `timeslots000000` |
| `bookings` | `bookings0000000` |
| `categories` | `categories00000` |
| `products` | `products0000000` |
| `orders` | `orders000000000` |
| `order_items` | `orderitems00000` |
| `events` | `events000000000` |

## Rule syntax (PB filter language)

Not SQL. Common patterns:

- `@request.auth.id != ''` — require authenticated user
- `user = @request.auth.id` — row belongs to requester (via relation field)
- `order.user = @request.auth.id` — chain through relations (order_items → orders → user)
- `published = true` — boolean check
- `null` — rule rejected entirely (admin API / server-side only)

## Gaps vs. the SQL source (follow-ups)

1. **`book_time_slot` stored procedure** (booking template, migration 005).
   PB has no equivalent to SQL `SECURITY DEFINER` functions. The atomic
   slot-reservation logic needs to move into either:
   - A PB JS hook (`pb_hooks/`) — preferred, runs server-side with admin auth
   - Or an admin-portal API route that uses the PB admin client (less ideal
     because it's a round-trip through the admin, but keeps logic in TS)

   Until this is reimplemented, bookings via the mobile app can race —
   two users can both `increment current_bookings + insert booking` for the
   same slot simultaneously. Tracked in the migration plan.

2. **Complex JSON indexes** — Supabase had `CREATE INDEX ... USING GIN (data)`
   on `directory_items.data`. PB/SQLite doesn't support GIN; queries that
   filter on JSON contents will scan. Fine for current scale; revisit if
   directory search becomes a bottleneck.

3. **Arrays (`TEXT[]`)** — Supabase's `attachments TEXT[]` on
   `form_submissions` is modeled as `json` in PB. Read/write shape changes
   (arrays vs JSON-encoded arrays). Mobile code using this field needs a
   small adjustment when the forms hook is ported.

4. **Decimal precision** — Supabase `DECIMAL(10,2)` is modeled as PB `number`
   (float64). Adequate for USD prices in reasonable ranges; not safe for
   large financial calculations. Acceptable for current product shape.

5. **User references** — Every `user` field references `_pb_users_auth_`,
   which is PB's built-in users collection. Phase 3 (end-user auth migration)
   is what actually creates users in that collection. Until Phase 3 lands,
   these collections can be read/written by admins but not by end users,
   because there are no PB users yet.
