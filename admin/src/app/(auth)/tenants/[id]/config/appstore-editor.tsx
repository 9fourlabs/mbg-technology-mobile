"use client";

import ImageUploader from "@/components/ImageUploader";
import type { AppTemplate, AppStoreMetadata } from "@/lib/types";

interface Props {
  tenantId: string;
  config: AppTemplate;
  onChange: (updated: AppTemplate) => void;
  expoProjectId: string;
  onExpoProjectIdChange: (id: string) => void;
}

export default function AppStoreEditor({ tenantId, config, onChange, expoProjectId, onExpoProjectIdChange }: Props) {
  const appStore: AppStoreMetadata = (config as Record<string, unknown>).appStore as AppStoreMetadata ?? {
    appName: "",
  };

  function update(patch: Partial<AppStoreMetadata>) {
    onChange({
      ...config,
      appStore: { ...appStore, ...patch },
    } as AppTemplate);
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-1">App Store Metadata</h2>
      <p className="text-sm text-gray-500 mb-6">
        Configure how your app appears in the App Store and Google Play.
      </p>

      {/* App Name */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-600 mb-1">App Name</label>
        <p className="text-xs text-gray-400 mb-2">The display name shown on the home screen and store listing.</p>
        <input
          type="text"
          value={appStore.appName ?? ""}
          onChange={(e) => update({ appName: e.target.value })}
          className="w-full rounded-lg bg-gray-100 border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="My App"
        />
      </div>

      {/* App Description */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-600 mb-1">App Description</label>
        <p className="text-xs text-gray-400 mb-2">A short description for the store listing.</p>
        <textarea
          value={appStore.appDescription ?? ""}
          onChange={(e) => update({ appDescription: e.target.value })}
          rows={4}
          className="w-full rounded-lg bg-gray-100 border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          placeholder="Describe what your app does..."
        />
      </div>

      {/* Keywords */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-600 mb-1">Keywords</label>
        <p className="text-xs text-gray-400 mb-2">Comma-separated keywords to help users find your app.</p>
        <input
          type="text"
          value={(appStore.appKeywords ?? []).join(", ")}
          onChange={(e) => {
            const keywords = e.target.value
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean);
            update({ appKeywords: keywords });
          }}
          className="w-full rounded-lg bg-gray-100 border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="booking, salon, appointments"
        />
      </div>

      {/* App Icon */}
      <div className="mb-5">
        <ImageUploader
          tenantId={tenantId}
          category="app-icon"
          label="App Icon"
          currentUrl={appStore.iconUri}
          onUpload={(url) => update({ iconUri: url })}
        />
      </div>

      {/* Adaptive Icon Background Color */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Adaptive Icon Background Color
        </label>
        <p className="text-xs text-gray-400 mb-2">Background color for Android adaptive icons.</p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={appStore.adaptiveIconBackgroundColor ?? "#E6F4FE"}
            onChange={(e) => update({ adaptiveIconBackgroundColor: e.target.value })}
            className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={appStore.adaptiveIconBackgroundColor ?? ""}
            onChange={(e) => update({ adaptiveIconBackgroundColor: e.target.value })}
            className="flex-1 rounded-lg bg-gray-100 border border-gray-300 px-4 py-2.5 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="#E6F4FE"
          />
        </div>
      </div>

      {/* Splash Background Color */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Splash Background Color
        </label>
        <p className="text-xs text-gray-400 mb-2">Background color of the splash screen shown on app launch.</p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={appStore.splashBackgroundColor ?? "#ffffff"}
            onChange={(e) => update({ splashBackgroundColor: e.target.value })}
            className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={appStore.splashBackgroundColor ?? ""}
            onChange={(e) => update({ splashBackgroundColor: e.target.value })}
            className="flex-1 rounded-lg bg-gray-100 border border-gray-300 px-4 py-2.5 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="#ffffff"
          />
        </div>
      </div>
      {/* ── Expo Project ID ── */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Expo Project</h2>
        <p className="text-sm text-gray-500 mb-4">
          Required for production builds. Find yours at{" "}
          <a href="https://expo.dev" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            expo.dev
          </a>{" "}
          → your project → Project ID.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Expo Project ID</label>
          <input
            type="text"
            value={expoProjectId}
            onChange={(e) => onExpoProjectIdChange(e.target.value.trim())}
            className="w-full py-2.5 px-4 border-gray-200 rounded-lg text-sm font-mono focus:border-blue-500 focus:ring-blue-500"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
        </div>
      </div>

      {/* ── Submission identifiers ── */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Store Submission</h2>
        <p className="text-sm text-gray-500 mb-4">
          IDs needed to submit this tenant&apos;s build to the App Store and Google Play.
          See <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">docs/STORE_SUBMISSION.md</code> for how to get these.
        </p>

        {/* iOS ASC App ID */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            App Store Connect App ID <span className="text-gray-400 font-normal">(iOS)</span>
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Numeric ID from App Store Connect → App Information → General → &ldquo;Apple ID&rdquo;.
            Leave empty if this tenant won&apos;t ship to iOS.
          </p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={appStore.iosAscAppId ?? ""}
            onChange={(e) => update({ iosAscAppId: e.target.value.trim() || undefined })}
            className="w-full py-2.5 px-4 border-gray-200 rounded-lg text-sm font-mono focus:border-blue-500 focus:ring-blue-500"
            placeholder="1234567890"
          />
        </div>

        {/* Android package override */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Play Console Package Name <span className="text-gray-400 font-normal">(Android, optional)</span>
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Only set this if the Play Console listing uses a package name different from
            the auto-generated one. Defaults to <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">com.mbg.info.&lt;tenant&gt;</code>.
          </p>
          <input
            type="text"
            value={appStore.androidPackageName ?? ""}
            onChange={(e) => update({ androidPackageName: e.target.value.trim() || undefined })}
            className="w-full py-2.5 px-4 border-gray-200 rounded-lg text-sm font-mono focus:border-blue-500 focus:ring-blue-500"
            placeholder="com.example.app"
          />
        </div>

        {/* Push notifications opt-in */}
        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={appStore.pushEnabled ?? false}
              onChange={(e) => update({ pushEnabled: e.target.checked || undefined })}
              className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-700">
                Enable push notifications
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Off by default. Turn on after the iOS provisioning profile has the
                Push Notifications capability (see <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">docs/PUSH_NOTIFICATIONS.md</code>).
                Builds will fail if this is on but the entitlement is missing.
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
