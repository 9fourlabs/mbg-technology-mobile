/**
 * Single source of truth for the shared Pocketbase admin email.
 *
 * Every per-tenant PB instance (and the central admin PB instance) uses the
 * same admin account so we only need one credential pair to talk to any
 * of them from the admin portal or provisioning scripts.
 *
 * The matching value is hardcoded in `infra/pocketbase/fly.toml.tpl`'s
 * `[env]` block so the entrypoint sees the same string at container boot.
 * Don't change it in one place without updating the other.
 *
 * The PASSWORD lives in 1Password / Fly secrets (`PB_ADMIN_PASSWORD`) and is
 * legitimately secret. The email is just a routing identifier.
 */
export const PB_ADMIN_EMAIL = "pb-admin@9fourlabs.com";
