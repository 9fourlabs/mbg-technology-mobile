import { test, expect } from "@playwright/test";

/**
 * These tests hit /share/[tenantId] with no auth session — the page MUST
 * stay publicly accessible. Regression we've already shipped once: the page
 * querying tenants via the user-scoped client got RLS-blocked for anon
 * visitors and returned a false 404. Test pins that behavior.
 */

test.describe("share page (public)", () => {
  test("MBG share page renders with branding + Launch button", async ({ page }) => {
    const res = await page.goto("/share/mbg");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: /MBG Technology/i })).toBeVisible();
    await expect(page.getByText(/Preview Build/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /Launch browser preview/i })).toBeVisible();
  });

  test("Launch link points at appetize.io, opens in a new tab", async ({ page }) => {
    await page.goto("/share/mbg");
    const launch = page.getByRole("link", { name: /Launch browser preview/i });
    await expect(launch).toHaveAttribute("href", /^https:\/\/appetize\.io\/app\//);
    await expect(launch).toHaveAttribute("target", "_blank");
    await expect(launch).toHaveAttribute("rel", /noopener/);
  });

  test("install-on-device section is collapsed by default, expands on click", async ({ page }) => {
    await page.goto("/share/mbg");
    const section = page.getByRole("button", { name: /Install on your device/i });
    await expect(section).toBeVisible();
    // Android sub-section is hidden until the parent is expanded.
    await expect(page.getByText(/Scan with your phone camera/i)).toBeHidden();
    await section.click();
    // Android sub-heading shows once expanded. The <p>Android</p> lives inside a
    // button whose accessible name is "📱 Android Install directly — no app store needed".
    await expect(page.getByText(/^Android$/).first()).toBeVisible();
  });

  test("unknown tenant returns 404", async ({ page }) => {
    const res = await page.goto("/share/this-tenant-does-not-exist");
    expect(res?.status()).toBe(404);
  });
});
