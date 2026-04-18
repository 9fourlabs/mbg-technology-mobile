import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";

// Push notifications are gated on EXPO_PUSH_ENABLED at build time (see
// app.config.ts plugins block). When the plugin is absent we expose the
// same shape but no-op so the rest of the app doesn't have to branch.

type PushHookResult = {
  expoPushToken: string | null;
  notification: unknown | null;
  permissionStatus: "granted" | "denied" | "undetermined" | "unavailable";
};

const tenant = (Constants.expoConfig?.extra?.tenant as string | undefined) ?? "mbg";
const projectId = (Constants.expoConfig?.extra as Record<string, unknown> | undefined)
  ?.eas as { projectId?: string } | undefined;
const adminUrl = (Constants.expoConfig?.extra?.adminUrl as string | undefined) ?? "";

/**
 * Subscribe the device to push notifications for the current tenant.
 * Registers an Expo push token with the MBG admin portal so that the client
 * portal's "Send notification" action can broadcast to this device.
 *
 * Safe to call from anywhere — the hook handles the "expo-notifications not
 * installed in this build" case by reporting permissionStatus="unavailable".
 */
export function usePushNotifications(): PushHookResult {
  const [token, setToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<unknown | null>(null);
  const [status, setStatus] = useState<PushHookResult["permissionStatus"]>(
    "undetermined"
  );
  const subRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Dynamic import so that builds without the native module (preview /
      // initial builds before the iOS push capability is fixed) don't crash.
      let Notifications: typeof import("expo-notifications") | null = null;
      let Device: typeof import("expo-device") | null = null;
      try {
        Notifications = (await import("expo-notifications")).default
          ? // some bundlers wrap default exports; normalize
            ((await import("expo-notifications")) as unknown as typeof import("expo-notifications"))
          : (await import("expo-notifications"));
        Device = await import("expo-device");
      } catch {
        if (!cancelled) setStatus("unavailable");
        return;
      }

      if (!Device.isDevice) {
        // Push tokens are not issued for simulators.
        if (!cancelled) setStatus("unavailable");
        return;
      }

      const existing = await Notifications.getPermissionsAsync();
      let granted = existing.status === "granted";
      if (!granted) {
        const next = await Notifications.requestPermissionsAsync();
        granted = next.status === "granted";
      }

      if (!granted) {
        if (!cancelled) setStatus("denied");
        return;
      }

      try {
        const tokenResult = await Notifications.getExpoPushTokenAsync(
          projectId?.projectId ? { projectId: projectId.projectId } : undefined
        );
        if (cancelled) return;
        setToken(tokenResult.data);
        setStatus("granted");

        // Register the token with the admin portal. Failures are logged but
        // not surfaced to the user — they'll be resurfaced on next launch.
        if (adminUrl) {
          try {
            await fetch(`${adminUrl}/api/tenants/${tenant}/notifications/register`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                device_token: tokenResult.data,
                platform: Platform.OS,
              }),
            });
          } catch (err) {
            console.warn("Failed to register push token:", err);
          }
        }

        // Listen for foreground notifications.
        const sub = Notifications.addNotificationReceivedListener((n) => {
          setNotification(n);
        });
        subRef.current = sub;
      } catch (err) {
        console.warn("Failed to obtain push token:", err);
        if (!cancelled) setStatus("denied");
      }
    })();

    return () => {
      cancelled = true;
      subRef.current?.remove();
    };
  }, []);

  return { expoPushToken: token, notification, permissionStatus: status };
}
