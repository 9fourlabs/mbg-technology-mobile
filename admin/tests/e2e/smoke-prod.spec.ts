import { test, expect } from "@playwright/test";

/**
 * Read-only smoke tests against the deployed Fly app. Runs when
 * PLAYWRIGHT_TARGET=prod — see playwright.config.ts.
 *
 * These must NEVER touch write endpoints or create/delete rows. They exist
 * to catch "deploy broke prod" failures quickly in CI after a Fly push.
 */
test.describe("prod smoke", () => {
  test("login page loads", async ({ page }) => {
    const res = await page.goto("/login");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: /MBG Admin/i })).toBeVisible();
  });

  test("client login page loads", async ({ page }) => {
    const res = await page.goto("/client/login");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("button", { name: /Sign In/i })).toBeVisible();
  });

  test("MBG share page publicly reachable with Launch button", async ({ page }) => {
    const res = await page.goto("/share/mbg");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: /MBG Technology/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Launch browser preview/i })).toBeVisible();
  });

  test("root redirects auth-gated user to /login", async ({ page }) => {
    const res = await page.goto("/");
    // 307 → /login?redirectTo=%2F. Playwright follows it transparently.
    expect(res?.status()).toBe(200);
    await expect(page).toHaveURL(/\/login/);
  });
});
