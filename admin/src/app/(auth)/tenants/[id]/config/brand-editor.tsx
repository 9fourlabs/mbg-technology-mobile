"use client";

import ImageUploader from "@/components/ImageUploader";

interface BrandEditorProps {
  tenantId: string;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

const COLOR_FIELDS = [
  { key: "primaryColor", label: "Primary Color", desc: "Buttons, links, active states" },
  { key: "backgroundColor", label: "Background", desc: "App background" },
  { key: "textColor", label: "Text Color", desc: "Headings and body text" },
  { key: "mutedTextColor", label: "Muted Text", desc: "Subtitles and captions" },
];

export default function BrandEditor({ tenantId, config, onChange }: BrandEditorProps) {
  const brand = (config?.brand ?? {}) as Record<string, string>;

  function updateBrand(key: string, value: string) {
    onChange({ ...config, brand: { ...brand, [key]: value } });
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-1">Brand Settings</h2>
      <p className="text-sm text-gray-500 mb-6">
        Colors and logo that define how your client&apos;s app looks.
      </p>

      {/* Logo */}
      <div className="mb-6">
        <ImageUploader
          tenantId={tenantId}
          category="logo"
          label="Logo"
          currentUrl={brand.logoUri ?? brand.logoUrl}
          onUpload={(url) => updateBrand("logoUri", url)}
        />
      </div>

      {/* Colors */}
      <div className="space-y-4">
        {COLOR_FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              {field.label}
            </label>
            <p className="text-xs text-gray-400 mb-2">{field.desc}</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brand[field.key] ?? "#000000"}
                onChange={(e) => updateBrand(field.key, e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={brand[field.key] ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                    updateBrand(field.key, v);
                  }
                }}
                placeholder="#000000"
                className="w-28 px-3 py-2 rounded-lg bg-gray-100 border border-gray-300 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div
                className="w-full h-8 rounded-lg border border-gray-300"
                style={{ backgroundColor: brand[field.key] ?? "#000000" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
