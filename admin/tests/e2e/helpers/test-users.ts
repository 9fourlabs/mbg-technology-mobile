/**
 * Test user credentials for Playwright. Email addresses are hardcoded because
 * the seeded rows in Supabase auth.users reference these exact values.
 *
 * Passwords come from env vars — locally sourced from 1Password, in CI from
 * GitHub Actions secrets. If either is missing, auth.setup.ts throws a clear
 * error instead of the tests silently running unauthenticated.
 *
 * To seed / re-seed the users, see tests/e2e/README.md.
 */

export const ADMIN_USER = {
  email: "playwright-admin@9fourlabs.com",
  get password(): string {
    const pw = process.env.PLAYWRIGHT_ADMIN_PASSWORD;
    if (!pw) throw new Error("PLAYWRIGHT_ADMIN_PASSWORD env var is required");
    return pw;
  },
};

export const CLIENT_USER = {
  email: "playwright-client@9fourlabs.com",
  tenantId: "mbg",
  get password(): string {
    const pw = process.env.PLAYWRIGHT_CLIENT_PASSWORD;
    if (!pw) throw new Error("PLAYWRIGHT_CLIENT_PASSWORD env var is required");
    return pw;
  },
};
