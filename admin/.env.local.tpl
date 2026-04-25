# Template for admin/.env.local, consumed by `op inject`.
#
# Usage:
#   op inject -i admin/.env.local.tpl -o admin/.env.local
#
# Requires: 1Password CLI with desktop-app integration enabled
# (Settings → Developer → "Integrate with 1Password CLI").
#
# Do NOT put literal secrets here — only 1Password references. The rendered
# .env.local is gitignored; this file is safe to commit.

# --- Admin Supabase (central mbg-admin project: ref wmckytfxlcxzhzduttvv) ---
NEXT_PUBLIC_SUPABASE_URL={{ op://MBG/MBG Admin Supabase/supabase_url }}
NEXT_PUBLIC_SUPABASE_ANON_KEY={{ op://MBG/MBG Admin Supabase/anon_key }}
SUPABASE_SERVICE_ROLE_KEY={{ op://MBG/MBG Admin Supabase/service_role_key }}

# Supabase Management API PAT (used for per-tenant DB provisioning)
SUPABASE_ACCESS_TOKEN={{ op://MBG/Supabase PAT/credential }}

# --- EAS ---
EXPO_TOKEN={{ op://MBG/Expo/credential }}

# --- GitHub (dispatches EAS workflows from admin UI) ---
GITHUB_TOKEN={{ op://MBG/GitHub - mbg-mobile/credential }}
GITHUB_REPO=9fourlabs/mbg-technology-mobile

# --- Build link HMAC signing ---
ADMIN_BUILD_LINK_SECRET={{ op://MBG/ADMIN_BUILD_LINK_SECRET/password }}

# --- Optional: Appetize (for in-admin preview embedding) ---
# APPETIZE_API_KEY=

# --- Pocketbase admin instance (Supabase replacement, Phase A) ---
# Source of truth for cross-tenant infra (tenants, builds, tenant_users,
# push_tokens, analytics_events, activity_log). Currently shadow — no admin
# portal code reads from here yet. Phase B flips ADMIN_BACKEND on.
POCKETBASE_ADMIN_URL=https://mbg-pb-admin.fly.dev
PB_ADMIN_PASSWORD={{ op://MBG/Pocketbase Admin/password }}
# ADMIN_BACKEND=supabase  # set to "pocketbase" once Phase B helpers land
