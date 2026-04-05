import type { ExpoConfig } from "expo/config";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// This repo supports multi-tenant / white-label builds.
// Set APP_TENANT=mbg (or another tenant key) to swap branding/content.
const tenant = process.env.APP_TENANT ?? "mbg";

// Android package names and iOS bundle IDs cannot contain hyphens.
// Replace hyphens with dots for valid identifiers (e.g., sample-booking → sample.booking).
const tenantSafe = tenant.replace(/-/g, ".");

// For demos/previews we can reuse the same native identifiers across tenants.
// This prevents EAS from requiring new signing credentials per tenant.
//
// - shared: use the MBG iOS bundle id + Android package for ALL tenants (previews)
// - tenant: include tenant in bundle id/package (production-style isolation)
const nativeIdMode = process.env.NATIVE_ID_MODE ?? "tenant";

const sharedAndroidPackage = "com.mbg.mbgtechnologymobile";
const sharedIosBundleId = "com.mbg.mbgtechnologymobile";

/**
 * Resolve an asset path for the current tenant, falling back to the default.
 */
function resolveAsset(tenantKey: string, filename: string): string {
  const tenantPath = `./assets/${tenantKey}/${filename}`;
  if (existsSync(resolve(__dirname, tenantPath))) {
    return tenantPath;
  }
  return `./assets/default/${filename}`;
}

/**
 * Load the full tenant JSON config so we can read appStore + brand metadata.
 */
function loadTenantConfig(tenantKey: string): Record<string, any> | null {
  const configPath = resolve(__dirname, `configs/tenants/${tenantKey}.json`);
  try {
    if (existsSync(configPath)) {
      return JSON.parse(readFileSync(configPath, "utf8"));
    }
  } catch {
    // fall through
  }
  return null;
}

const tenantConfig = loadTenantConfig(tenant);
const appStore = tenantConfig?.appStore;

const config: ExpoConfig = {
  name: appStore?.appName ?? (tenant === "mbg" ? "MBG Technology" : tenant.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")),
  slug: nativeIdMode === "shared" || tenant === "mbg" ? "mbg-technology" : `info-${tenant}`,
  version: process.env.APP_VERSION ?? "1.0.0",
  orientation: "portrait",
  icon: resolveAsset(tenant, "icon.png"),
  userInterfaceStyle: "light",
  splash: {
    image: resolveAsset(tenant, "splash-icon.png"),
    resizeMode: "contain",
    backgroundColor: appStore?.splashBackgroundColor ?? tenantConfig?.brand?.splashBackgroundColor ?? "#ffffff",
  },
  ios: {
    supportsTablet: true,
    // For production-style isolation, each tenant should have a unique bundleIdentifier.
    // For shared preview, keep the identifier stable across tenants.
    bundleIdentifier:
      nativeIdMode === "shared"
        ? sharedIosBundleId
        : tenant === "mbg"
          ? "com.mbg.mbgtechnologymobile"
          : `com.mbg.info.${tenantSafe}`,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: appStore?.adaptiveIconBackgroundColor ?? "#E6F4FE",
      foregroundImage: resolveAsset(tenant, "android-icon-foreground.png"),
      backgroundImage: resolveAsset(tenant, "android-icon-background.png"),
      monochromeImage: resolveAsset(tenant, "android-icon-monochrome.png"),
    },
    predictiveBackGestureEnabled: false,
    // For production-style isolation, each tenant should have a unique package.
    // For shared preview, keep the identifier stable across tenants.
    package:
      nativeIdMode === "shared"
        ? sharedAndroidPackage
        : tenant === "mbg"
          ? "com.mbg.mbgtechnologymobile"
          : `com.mbg.info.${tenantSafe}`,
  },
  plugins: [
    "expo-secure-store",
    // expo-notifications plugin temporarily removed: existing iOS provisioning
    // profile lacks push notification capability. Re-enable after regenerating
    // the profile with push capability in Apple Developer portal.
    // JS-level notification APIs still work for foreground notifications.
    // Sentry Expo plugin omitted: AGP 5.12.2 (from @sentry/react-native v7) is
    // incompatible with Gradle 9.0.0 (Expo SDK 55). JS-level error tracking still
    // works via Sentry.init() in index.ts. Re-enable when upgrading to Expo SDK 56+
    // which pairs with @sentry/react-native v8 and a compatible AGP version.
  ],
  web: {
    favicon: resolveAsset(tenant, "favicon.png"),
  },
  extra: {
    tenant,
    nativeIdMode,
    eas: {
      projectId: "8f0869f4-6354-4c29-956a-abf07a54c9b6",
    },
  },
};

export default config;
