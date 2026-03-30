import type { ExpoConfig } from "expo/config";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// This repo supports multi-tenant / white-label builds.
// Set APP_TENANT=mbg (or another tenant key) to swap branding/content.
const tenant = process.env.APP_TENANT ?? "mbg";

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
 * Try to load the tenant JSON config and pull splashBackgroundColor from brand.
 */
function loadSplashBackgroundColor(tenantKey: string): string {
  const configPath = resolve(__dirname, `configs/tenants/${tenantKey}.json`);
  try {
    if (existsSync(configPath)) {
      const raw = JSON.parse(readFileSync(configPath, "utf8"));
      if (raw?.brand?.splashBackgroundColor) {
        return raw.brand.splashBackgroundColor;
      }
    }
  } catch {
    // fall through to default
  }
  return "#ffffff";
}

const config: ExpoConfig = {
  name: tenant === "mbg" ? "MBG Technology" : "Informational App",
  slug: nativeIdMode === "shared" || tenant === "mbg" ? "mbg-technology" : `info-${tenant}`,
  version: "1.0.0",
  orientation: "portrait",
  icon: resolveAsset(tenant, "icon.png"),
  userInterfaceStyle: "light",
  splash: {
    image: resolveAsset(tenant, "splash-icon.png"),
    resizeMode: "contain",
    backgroundColor: loadSplashBackgroundColor(tenant),
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
          : `com.mbg.info.${tenant}`,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
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
          : `com.mbg.info.${tenant}`,
  },
  plugins: ["expo-secure-store"],
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
