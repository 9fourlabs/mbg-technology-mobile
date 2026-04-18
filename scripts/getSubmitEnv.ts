#!/usr/bin/env tsx
/**
 * Read a tenant's submission identifiers from configs/tenants/<tenant>.json
 * and emit them as shell-exportable env vars that `eas submit` will
 * interpolate into eas.json.
 *
 * Consumed by .eas/workflows/release-tenant.yml before calling `eas submit`:
 *
 *   eval "$(npx --yes tsx scripts/getSubmitEnv.ts <tenant>)"
 *   eas submit --profile production --platform ios
 *
 * Exits non-zero if required fields are missing.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const [, , tenant, platformArg] = process.argv;

if (!tenant) {
  console.error("Usage: tsx scripts/getSubmitEnv.ts <tenant> [ios|android|both]");
  process.exit(1);
}

const platform = (platformArg ?? "both") as "ios" | "android" | "both";
if (!["ios", "android", "both"].includes(platform)) {
  console.error(`Invalid platform "${platform}" — must be ios | android | both`);
  process.exit(1);
}

const configPath = resolve(__dirname, `../configs/tenants/${tenant}.json`);
if (!existsSync(configPath)) {
  console.error(`Tenant config not found: ${configPath}`);
  process.exit(1);
}

const config = JSON.parse(readFileSync(configPath, "utf8")) as {
  appStore?: {
    iosAscAppId?: string;
    androidPackageName?: string;
  };
};

// Apple Team ID is shared across all MBG-owned tenants. If a future tenant
// ships under their own Apple Developer team, we can override with a
// per-tenant field here.
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID ?? "";

const lines: string[] = [];
const missing: string[] = [];

if (platform === "ios" || platform === "both") {
  const ascAppId = config.appStore?.iosAscAppId;
  if (!ascAppId) missing.push("appStore.iosAscAppId (required for iOS submit)");
  if (!APPLE_TEAM_ID) missing.push("APPLE_TEAM_ID env var (required for iOS submit; set as a repo-level CI secret)");
  if (ascAppId) lines.push(`export ASC_APP_ID="${ascAppId}"`);
  if (APPLE_TEAM_ID) lines.push(`export APPLE_TEAM_ID="${APPLE_TEAM_ID}"`);
}

// Android has no tenant-specific submit env vars — eas.json references the
// Play service account via EAS-managed credentials (uploaded once per Expo
// project via `eas credentials`). The `track` / `releaseStatus` fields in
// eas.json are constant across tenants.

if (missing.length > 0) {
  console.error(`Missing required submission config for tenant "${tenant}":`);
  for (const m of missing) console.error(`  - ${m}`);
  console.error("");
  console.error("See docs/STORE_SUBMISSION.md for how to populate these.");
  process.exit(1);
}

for (const line of lines) console.log(line);
