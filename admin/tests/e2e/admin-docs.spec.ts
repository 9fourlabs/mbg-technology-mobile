import { test, expect } from "@playwright/test";

/**
 * Docs route tests. "Getting Started" (and other guide titles) appear BOTH
 * in the left sidebar and in the README body, so sidebar-specific lookups
 * need to scope to the complementary (aside) landmark.
 */
test.describe("admin — consultant docs", () => {
  test("/docs index renders with the consultant sidebar listing every guide", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.getByRole("heading", { name: /Consultant Guide/i })).toBeVisible();
    const sidebar = page.getByRole("complementary");
    for (const title of [
      "Overview",
      "Getting Started",
      "Glossary",
      "Choosing a Template",
      "Onboarding a Client",
      "Configuring an App",
      "Content and Updates",
      "Sending Push Notifications",
      "Analytics Explained",
      "Troubleshooting",
    ]) {
      await expect(sidebar.getByRole("link", { name: title })).toBeVisible();
    }
  });

  test("individual guide renders with its heading", async ({ page }) => {
    await page.goto("/docs/getting-started");
    await expect(page.getByRole("heading", { name: /^Getting Started$/ })).toBeVisible();
    // TL;DR marker appears at the top of every guide we write.
    await expect(page.getByText(/TL;DR/).first()).toBeVisible();
  });

  test("sidebar link navigates to the right slug", async ({ page }) => {
    await page.goto("/docs");
    const sidebar = page.getByRole("complementary");
    const link = sidebar.getByRole("link", { name: "Glossary" });
    await expect(link).toHaveAttribute("href", "/docs/glossary");
    await link.click();
    await expect(page).toHaveURL(/\/docs\/glossary/);
    await expect(page.getByRole("heading", { name: /^Glossary$/ })).toBeVisible();
  });

  test("404 for unknown guide slug", async ({ page }) => {
    const res = await page.goto("/docs/this-guide-does-not-exist");
    expect(res?.status()).toBe(404);
  });
});
