import { cleanupTestTenants } from "./helpers/supabase-admin";

/**
 * Sweep any leftover `playwright-*` tenant rows after the suite runs. The
 * create-wizard tests delete their own rows on success, but a mid-test
 * crash could leave detritus behind — this catches those.
 *
 * Referenced from playwright.config.ts `globalTeardown`.
 */
export default async function globalTeardown() {
  try {
    const count = await cleanupTestTenants();
    if (count > 0) {
      console.log(`[playwright teardown] cleaned up ${count} leftover test tenants`);
    }
  } catch (err) {
    console.warn("[playwright teardown] cleanup failed:", err);
  }
}
