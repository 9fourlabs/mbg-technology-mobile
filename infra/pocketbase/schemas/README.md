# Pocketbase Schemas

One JSON file per template type. `scripts/provisionPocketbase.ts` imports the
right one into a newly-provisioned PB instance.

| File | Template type | Source of truth replaced |
|------|---------------|--------------------------|
| `content.json` | content | `supabase/migrations/001_content.sql` |
| `directory.json` | directory | `supabase/migrations/002_directory.sql` *(TODO Phase 2)* |
| `forms.json` | forms | `supabase/migrations/003_forms.sql` *(TODO Phase 2)* |
| `loyalty.json` | loyalty | `supabase/migrations/004_loyalty.sql` *(TODO Phase 2)* |
| `booking.json` | booking | `supabase/migrations/005_booking.sql` *(TODO Phase 2)* |
| `commerce.json` | commerce | `supabase/migrations/006_commerce.sql` *(TODO Phase 2)* |
| `events.json` | events add-on | `supabase/migrations/016_events.sql` *(TODO Phase 2)* |

## Format

Each file is an array of PB collection definitions. PB's admin API accepts
these verbatim via `POST /api/collections/import`. The `_pb_users_auth_`
special collection is created automatically by PB — reference it for user
relations.

## Rule syntax

PB uses its own filter language (not SQL). Common patterns:

- `@request.auth.id != ''` — require authenticated user
- `user = @request.auth.id` — row belongs to requester
- `published = true` — boolean check
- `created >= @request.headers.since` — header-based filtering
- `null` — rule disallowed entirely (admin API only)

Rules become the equivalent of Supabase RLS policies.
