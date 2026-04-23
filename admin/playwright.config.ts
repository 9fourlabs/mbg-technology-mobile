import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the MBG admin portal.
 *
 * Two modes:
 *   - Default: tests run against the local Next dev server on BASE_URL
 *     (http://localhost:3000). Setup project signs in as the admin and
 *     client test users and saves storageState files that the admin/client
 *     projects reuse — avoids logging in on every test.
 *   - Smoke (PLAYWRIGHT_TARGET=prod): a smaller subset runs against
 *     https://mbg-admin.fly.dev to verify a fresh Fly deploy. No auth —
 *     only public routes are checked.
 *
 * Run:
 *   npm run test:e2e            # full suite against local dev
 *   npm run test:e2e:ui         # Playwright UI mode
 *   npm run test:e2e:smoke-prod # post-deploy smoke against prod
 */

const isProdSmoke = process.env.PLAYWRIGHT_TARGET === "prod";

const BASE_URL = isProdSmoke
  ? "https://mbg-admin.fly.dev"
  : process.env.BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: isProdSmoke ? undefined : [/smoke-prod\.spec\.ts/],
  outputDir: "./test-results",
  globalTeardown: isProdSmoke ? undefined : "./tests/e2e/global-teardown.ts",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: isProdSmoke
    ? [
        {
          name: "smoke-prod",
          testMatch: /smoke-prod\.spec\.ts/,
          use: { ...devices["Desktop Chrome"] },
        },
      ]
    : [
        {
          name: "setup",
          testMatch: /auth\.setup\.ts/,
        },
        {
          name: "admin",
          dependencies: ["setup"],
          testMatch: /admin-.*\.spec\.ts/,
          use: {
            ...devices["Desktop Chrome"],
            storageState: "tests/e2e/.auth/admin.json",
          },
        },
        {
          name: "client",
          dependencies: ["setup"],
          testMatch: /client-.*\.spec\.ts/,
          use: {
            ...devices["Desktop Chrome"],
            storageState: "tests/e2e/.auth/client.json",
          },
        },
        {
          name: "public",
          testMatch: /(share-page|smoke-public)\.spec\.ts/,
          use: {
            ...devices["Desktop Chrome"],
            storageState: { cookies: [], origins: [] },
          },
        },
      ],
  webServer:
    !isProdSmoke && !process.env.BASE_URL
      ? {
          command: "npm run dev",
          url: "http://localhost:3000/login",
          reuseExistingServer: true,
          timeout: 90_000,
        }
      : undefined,
});
