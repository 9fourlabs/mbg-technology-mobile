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
//
// NATIVE_ID_MODE controls both platforms. Per-platform overrides are available
// via NATIVE_ID_MODE_ANDROID and NATIVE_ID_MODE_IOS for cases like preview
// builds where Android needs tenant isolation (apps coexist on device) but iOS
// must stay shared (ad-hoc provisioning is bound to the shared bundle ID).
const nativeIdMode = process.env.NATIVE_ID_MODE ?? "tenant";
const androidIdMode = process.env.NATIVE_ID_MODE_ANDROID ?? nativeIdMode;
const iosIdMode = process.env.NATIVE_ID_MODE_IOS ?? nativeIdMode;

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

// Resolve the Expo project ID once so we can use it for both `extra.eas.projectId`
// and the OTA updates URL below.
const sharedPreviewProjectId = "8f0869f4-6354-4c29-956a-abf07a54c9b6";
const projectId = process.env.EAS_PROJECT_ID ?? sharedPreviewProjectId;

const config: ExpoConfig = {
  name: appStore?.appName ?? (tenant === "mbg" ? "MBG Technology" : tenant.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")),
  // Slug must match the EAS project. For preview builds (which use the shared
  // MBG project regardless of NATIVE_ID_MODE), keep the slug stable. For
  // production builds with a tenant-specific Expo project ID, use a tenant slug.
  // The EAS_PROJECT_ID env var is set by the release workflow when a tenant has
  // its own Expo project; its absence means we're using the shared project.
  slug:
    tenant === "mbg" || !process.env.EAS_PROJECT_ID
      ? "mbg-technology"
      : `info-${tenant}`,
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
      iosIdMode === "shared"
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
      androidIdMode === "shared"
        ? sharedAndroidPackage
        : tenant === "mbg"
          ? "com.mbg.mbgtechnologymobile"
          : `com.mbg.info.${tenantSafe}`,
  },
  plugins: [
    "expo-secure-store",
    "expo-updates",
    // Push notifications. Gated on EXPO_PUSH_ENABLED so a build can opt out
    // when the iOS provisioning profile doesn't yet have push capability —
    // attempting a build with this plugin enabled but no push entitlement
    // fails at signing time. To enable for a tenant:
    //   1. Apple Developer portal → App ID for the tenant → enable Push
    //      Notifications capability.
    //   2. `eas credentials` → iOS → regenerate the provisioning profile.
    //   3. Set EXPO_PUSH_ENABLED=1 in the EAS workflow env (already set by
    //      release-tenant.yml when tenant config has push enabled).
    //   4. Upload the Apple Push Key (.p8) and FCM service account JSON to
    //      EAS via `eas credentials`. See docs/PUSH_NOTIFICATIONS.md.
    ...(process.env.EXPO_PUSH_ENABLED ? ["expo-notifications" as const] : []),
    // Sentry Expo plugin omitted: AGP 5.12.2 (from @sentry/react-native v7) is
    // incompatible with Gradle 9.0.0 (Expo SDK 55). JS-level error tracking still
    // works via Sentry.init() in index.ts. Re-enable when upgrading to Expo SDK 56+
    // which pairs with @sentry/react-native v8 and a compatible AGP version.
  ],
  // OTA updates via EAS Update. runtimeVersion: "fingerprint" means native
  // changes auto-invalidate (requiring a new build), while JS/content-only
  // changes deliver instantly via `eas update`. See docs/OTA_UPDATES.md.
  runtimeVersion: { policy: "fingerprint" },
  updates: {
    url: `https://u.expo.dev/${projectId}`,
    enabled: true,
    checkAutomatically: "ON_LOAD",
    fallbackToCacheTimeout: 0,
  },
  web: {
    favicon: resolveAsset(tenant, "favicon.png"),
  },
  extra: {
    tenant,
    nativeIdMode,
    // URL of the MBG admin portal — used by the mobile app to register push
    // tokens and report analytics. Defaults to the production admin URL.
    adminUrl: process.env.EXPO_PUBLIC_ADMIN_URL ?? "https://admin.mbgtechnology.com",
    eas: {
      // Use tenant-specific Expo project ID when provided (production builds),
      // otherwise fall back to the shared MBG project (preview builds).
      projectId,
    },
  },
};

export default config;
