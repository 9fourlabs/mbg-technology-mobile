"use client";

import ImageUploader from "@/components/ImageUploader";
import type { AppTemplate, AppStoreMetadata } from "@/lib/types";

interface Props {
  tenantId: string;
  config: AppTemplate;
  onChange: (updated: AppTemplate) => void;
}

export default function AppStoreEditor({ tenantId, config, onChange }: Props) {
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
    </div>
  );
}
