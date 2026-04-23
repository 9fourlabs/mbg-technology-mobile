import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { ADMIN_USER, CLIENT_USER } from "./helpers/test-users";

/**
 * Sign in as the admin + client test users once per `npm run test:e2e`
 * invocation and save the resulting session cookies to storageState files.
 * Every test project (admin, client) declares this setup as a dependency so
 * they start pre-authenticated and skip the 2-3 second sign-in dance.
 */

const AUTH_DIR = path.join(__dirname, ".auth");
const ADMIN_STATE = path.join(AUTH_DIR, "admin.json");
const CLIENT_STATE = path.join(AUTH_DIR, "client.json");

if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

setup("sign in as admin", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN_USER.email);
  await page.getByLabel("Password").fill(ADMIN_USER.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  // After login the proxy redirects to /tenants (or /); wait for the app
  // sidebar rather than for a specific URL to be robust against both.
  await expect(page.getByRole("link", { name: /My Apps/i })).toBeVisible();
  await page.context().storageState({ path: ADMIN_STATE });
});

setup("sign in as client", async ({ page }) => {
  await page.goto("/client/login");
  await page.getByLabel("Email").fill(CLIENT_USER.email);
  await page.getByLabel("Password").fill(CLIENT_USER.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  // Clients land on /client after login. Wait for a URL that is /client
  // (possibly with a tenant suffix) BUT NOT /client/login — a naive
  // `/\/client(\/|$)/` regex matches /client/login and produces empty state.
  await page.waitForURL((url) =>
    url.pathname === "/client" ||
    (url.pathname.startsWith("/client/") && !url.pathname.endsWith("/login")),
  );
  await page.context().storageState({ path: CLIENT_STATE });
});
