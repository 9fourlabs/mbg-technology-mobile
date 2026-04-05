import { useCallback, useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import Constants from "expo-constants";

type AnalyticsEvent = {
  tenant_id: string;
  anonymous_id: string;
  event_name: string;
  event_data?: Record<string, unknown>;
  screen_name?: string;
  platform: string;
  app_version: string;
};

const BATCH_INTERVAL = 30_000; // 30 seconds
const ANALYTICS_ENDPOINT = process.env.EXPO_PUBLIC_ANALYTICS_URL;

let deviceId: string | null = null;
function getDeviceId(): string {
  if (!deviceId) {
    // Use installation ID as anonymous identifier
    deviceId = Constants.installationId ?? `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  return deviceId;
}

const eventQueue: AnalyticsEvent[] = [];

function flush() {
  if (eventQueue.length === 0 || !ANALYTICS_ENDPOINT) return;
  const batch = eventQueue.splice(0, eventQueue.length);
  fetch(ANALYTICS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events: batch }),
  }).catch(() => {
    // Re-queue on failure (once)
    eventQueue.unshift(...batch);
  });
}

export function useAnalytics() {
  const tenant = String((Constants.expoConfig?.extra as any)?.tenant ?? "mbg");
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const flushTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Periodic flush
    flushTimer.current = setInterval(flush, BATCH_INTERVAL);

    // Flush on app background
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") flush();
    });

    return () => {
      if (flushTimer.current) clearInterval(flushTimer.current);
      sub.remove();
      flush(); // Final flush on unmount
    };
  }, []);

  const trackEvent = useCallback(
    (eventName: string, data?: Record<string, unknown>) => {
      eventQueue.push({
        tenant_id: tenant,
        anonymous_id: getDeviceId(),
        event_name: eventName,
        event_data: data,
        platform: Platform.OS,
        app_version: appVersion,
      });
    },
    [tenant, appVersion]
  );

  const trackScreenView = useCallback(
    (screenName: string) => {
      eventQueue.push({
        tenant_id: tenant,
        anonymous_id: getDeviceId(),
        event_name: "screen_view",
        screen_name: screenName,
        platform: Platform.OS,
        app_version: appVersion,
      });
    },
    [tenant, appVersion]
  );

  return { trackEvent, trackScreenView };
}
