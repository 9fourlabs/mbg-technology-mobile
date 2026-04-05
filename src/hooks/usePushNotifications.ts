/**
 * Push notification hook — currently a no-op stub.
 *
 * expo-notifications and expo-device were removed because the existing iOS
 * provisioning profile lacks Push Notification capability. To re-enable:
 *   1. Add push capability in Apple Developer portal for the App ID
 *   2. Regenerate provisioning profile (or clear EAS credentials)
 *   3. npm install expo-notifications expo-device
 *   4. Add "expo-notifications" back to plugins in app.config.ts
 *   5. Restore the full implementation from git history
 */
export function usePushNotifications() {
  return { expoPushToken: null, notification: null };
}
