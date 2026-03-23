import type { ExpoConfig } from "expo/config";

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

const config: ExpoConfig = {
  name: tenant === "mbg" ? "MBG Technology" : "Informational App",
  slug: tenant === "mbg" ? "mbg-technology-mobile" : `info-${tenant}`,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
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
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
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
  web: {
    favicon: "./assets/favicon.png",
  },
  extra: {
    tenant,
    nativeIdMode,
    eas: {
      projectId: "f1c6d7ea-a92f-47d2-931b-d7d6b957d5dd",
    },
  },
};

export default config;

