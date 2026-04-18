#!/usr/bin/env tsx
/**
 * Publish an OTA (over-the-air) update for a tenant.
 *
 * Usage:
 *   npm run ota:preview -- --tenant acme-dental --message "Tweak hero copy"
 *   npm run ota:production -- --tenant acme-dental --message "Fix typo" --platform ios
 *
 * Channel strategy (must match build-time channels in eas.json / workflows):
 *   - preview:    branch `preview-<tenant>` in the shared preview Expo project
 *   - production: branch `production` in the tenant-specific Expo project
 *
 * See docs/OTA_UPDATES.md.
 */

import { spawnSync } from "child_process";
import { tenantProjects } from "./tenantProjects";

type Env = "preview" | "production";

function parseArgs(): {
  env: Env;
  tenant: string;
  message: string;
  platform: "ios" | "android" | "all";
} {
  const [, , envArg, ...rest] = process.argv;

  if (envArg !== "preview" && envArg !== "production") {
    throw new Error(`First argument must be "preview" or "production", got "${envArg}"`);
  }

  const flags: Record<string, string> = {};
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = rest[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`Flag --${key} requires a value`);
      }
      flags[key] = value;
      i++;
    }
  }

  if (!flags.tenant) throw new Error("Missing required flag --tenant");
  if (!flags.message) throw new Error("Missing required flag --message");

  const platform = (flags.platform ?? "all") as "ios" | "android" | "all";
  if (!["ios", "android", "all"].includes(platform)) {
    throw new Error(`--platform must be ios | android | all, got "${platform}"`);
  }

  return { env: envArg, tenant: flags.tenant, message: flags.message, platform };
}

function main(): void {
  const { env, tenant, message, platform } = parseArgs();

  const branch = env === "production" ? "production" : `preview-${tenant}`;
  const projectId = env === "production" ? tenantProjects[tenant] : undefined;

  if (env === "production") {
    if (!projectId) {
      throw new Error(
        `No Expo project ID mapped for tenant "${tenant}" in scripts/tenantProjects.ts. ` +
          `Production OTA requires per-tenant project isolation.`
      );
    }
    if (projectId.startsWith("PLACEHOLDER")) {
      throw new Error(
        `Tenant "${tenant}" has a placeholder Expo project ID in scripts/tenantProjects.ts. ` +
          `Create a dedicated Expo project at https://expo.dev and update the mapping before publishing production updates.`
      );
    }
  }

  const args = [
    "update",
    "--branch",
    branch,
    "--message",
    message,
    "--non-interactive",
  ];
  if (platform !== "all") {
    args.push("--platform", platform);
  }
  if (projectId) {
    args.push("--project-id", projectId);
  }

  const childEnv: NodeJS.ProcessEnv = {
    ...process.env,
    APP_TENANT: tenant,
    NATIVE_ID_MODE: env === "production" ? "tenant" : "shared",
    NATIVE_ID_MODE_ANDROID: "tenant",
    NATIVE_ID_MODE_IOS: env === "production" ? "tenant" : "shared",
  };
  if (projectId) childEnv.EAS_PROJECT_ID = projectId;

  console.log(`Publishing OTA update:`);
  console.log(`  tenant:   ${tenant}`);
  console.log(`  env:      ${env}`);
  console.log(`  branch:   ${branch}`);
  console.log(`  platform: ${platform}`);
  console.log(`  message:  ${message}`);
  console.log(`  project:  ${projectId ?? "(shared preview project)"}`);
  console.log("");
  console.log(`  $ eas ${args.join(" ")}`);
  console.log("");

  const result = spawnSync("eas", args, { stdio: "inherit", env: childEnv });
  process.exit(result.status ?? 1);
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
