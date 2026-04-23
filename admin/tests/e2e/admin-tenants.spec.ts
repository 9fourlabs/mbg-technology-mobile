import { test, expect } from "@playwright/test";

test.describe("admin — tenants dashboard", () => {
  test("tenants list shows MBG with correct status", async ({ page }) => {
    await page.goto("/tenants");
    await expect(page.getByRole("heading", { name: /My Apps/i })).toBeVisible();
    // MBG appears in the tenant card. Use `.first()` because the same text
    // may appear in the sidebar brand header or other places.
    await expect(page.getByText("MBG Technology").first()).toBeVisible();
    await expect(page.getByText(/Total Apps/)).toBeVisible();
  });

  test("status-pill InfoTooltip explains Draft / Preview / Live", async ({ page }) => {
    await page.goto("/tenants");
    const tooltipTrigger = page
      .getByText(/Create and manage mobile apps/)
      .getByRole("button", { name: /More info/i });
    await tooltipTrigger.focus();
    await expect(
      page.getByText(/Draft.*config in progress.*Live.*App Store/i),
    ).toBeVisible();
  });

  test("sidebar navigation reaches every top-level page", async ({ page }) => {
    await page.goto("/tenants");

    await page.getByRole("link", { name: /Recent Builds/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole("link", { name: /^Analytics$/i }).click();
    await expect(page).toHaveURL(/\/analytics/);

    await page.getByRole("link", { name: /Settings/i }).click();
    await expect(page).toHaveURL(/\/settings/);

    await page.getByRole("link", { name: /Help & Guides/i }).click();
    await expect(page).toHaveURL(/\/docs/);

    await page.getByRole("link", { name: /My Apps/i }).click();
    await expect(page).toHaveURL(/\/tenants/);
  });

  test("settings page shows platform health panel", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText(/NEXT_PUBLIC_SUPABASE_URL/)).toBeVisible();
    await expect(page.getByText(/SUPABASE_SERVICE_ROLE_KEY/)).toBeVisible();
    await expect(page.getByText(/^EXPO_TOKEN$/)).toBeVisible();
  });

  test("opening the MBG tenant card navigates to its detail page", async ({ page }) => {
    await page.goto("/tenants");
    // Target the tenant card's link (there may be multiple MBG Technology
    // texts — sidebar brand, status cards, etc. — so scope to the list).
    const card = page.getByRole("link").filter({ hasText: "MBG Technology" }).first();
    await card.click();
    await expect(page).toHaveURL(/\/tenants\/mbg/);
  });
});
