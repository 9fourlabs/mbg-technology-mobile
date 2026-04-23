import { test, expect } from "@playwright/test";
import { ADMIN_USER } from "./helpers/test-users";

/**
 * These tests clear the pre-authed storageState so they can exercise the
 * real login flow and sign-out path end-to-end.
 *
 * Note on scope: the sidebar sign-out button calls supabase.auth.signOut()
 * with scope:"local" (see admin/src/components/Sidebar.tsx). Without that,
 * a global signOut here would invalidate the session the setup project
 * saved for other spec files and break every admin/client test in the run.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("admin auth", () => {
  test("login form gates access to the portal", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "MBG Admin" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("invalid credentials show an error message", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("nobody@9fourlabs.com");
    await page.getByLabel("Password").fill("definitely-wrong");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText(/invalid (login )?credentials/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("valid login honors ?redirectTo= deep link", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fsettings/);
    await page.getByLabel("Email").fill(ADMIN_USER.email);
    await page.getByLabel("Password").fill(ADMIN_USER.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByRole("link", { name: /My Apps/i })).toBeVisible();
  });

  test("sign out returns to the login page", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(ADMIN_USER.email);
    await page.getByLabel("Password").fill(ADMIN_USER.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByRole("link", { name: /My Apps/i })).toBeVisible();

    await page.getByRole("button", { name: /Sign Out/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
