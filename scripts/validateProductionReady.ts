/**
 * Validates that a specific tenant is ready for production release.
 *
 * This is a stricter gate than validate:tenants — it checks everything
 * validate:tenants checks PLUS production-specific requirements:
 *   - Tenant has a dedicated (non-placeholder, non-shared) Expo project ID
 *   - Tenant ID is valid for use in bundle identifiers
 *
 * Usage: tsx scripts/validateProductionReady.ts <tenant-id>
 * Used by: .eas/workflows/release-tenant.yml
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { tenantProjects, MBG_PROJECT_ID } from "./tenantProjects";

const [, , tenant, platformArg] = process.argv;
const platform = (platformArg ?? "both") as "ios" | "android" | "both";

if (!tenant) {
  console.error("Usage: tsx scripts/validateProductionReady.ts <tenant-id> [ios|android|both]");
  process.exit(1);
}

const errors: string[] = [];

// 1. Tenant must exist in project mapping
const projectId = tenantProjects[tenant];
if (!projectId) {
  errors.push(
    `Tenant "${tenant}" has no entry in scripts/tenantProjects.ts. ` +
      `Create a dedicated Expo project and add it before releasing.`
  );
} else {
  // 2. Must not be a placeholder
  if (projectId.startsWith("PLACEHOLDER")) {
    errors.push(
      `Tenant "${tenant}" has a placeholder project ID ("${projectId}"). ` +
        `Create a dedicated Expo project at https://expo.dev and update tenantProjects.ts.`
    );
  }

  // 3. Non-MBG tenants must not use the MBG project ID
  if (tenant !== "mbg" && projectId === MBG_PROJECT_ID) {
    errors.push(
      `Tenant "${tenant}" is using the shared MBG project ID. ` +
        `Production tenants must have their own dedicated Expo project to isolate ` +
        `credentials, build history, and store submissions.`
    );
  }
}

// 4. Tenant ID must be valid for Android package names and iOS bundle IDs
// Android: lowercase letters, digits, dots, hyphens (but we use it after com.9fourlabs.mbg.)
// iOS: same constraints. Hyphens are valid in bundle IDs.
if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(tenant) && !/^[a-z0-9]$/.test(tenant)) {
  errors.push(
    `Tenant ID "${tenant}" contains invalid characters. ` +
      `Use lowercase alphanumeric with hyphens (e.g., "acme-dental").`
  );
}

// 5. Submission identifiers present for the target platform(s)
const configPath = resolve(__dirname, `../configs/tenants/${tenant}.json`);
if (existsSync(configPath)) {
  const config = JSON.parse(readFileSync(configPath, "utf8")) as {
    appStore?: { iosAscAppId?: string; androidPackageName?: string };
  };
  if ((platform === "ios" || platform === "both") && !config.appStore?.iosAscAppId) {
    errors.push(
      `Tenant "${tenant}" is missing appStore.iosAscAppId. ` +
        `Register the app in App Store Connect, grab the numeric Apple ID, ` +
        `and set it in the admin UI → App Store → Store Submission.`
    );
  }
} else {
  errors.push(
    `Tenant config not found at ${configPath}. Run \`npm run build:tenants\` first.`
  );
}

if (errors.length > 0) {
  console.error(`Production readiness check FAILED for "${tenant}" (platform: ${platform}):\n`);
  for (const e of errors) {
    console.error(`  - ${e}`);
  }
  console.error("");
  process.exit(1);
} else {
  console.log(`Production readiness check PASSED for "${tenant}" (project: ${projectId}, platform: ${platform})`);
}
