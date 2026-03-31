"use client";

const DESIGN_PRESETS = [
  { id: "modern", label: "Modern", desc: "Clean & fresh", accent: "#2563EB" },
  { id: "classic", label: "Classic", desc: "Timeless & structured", accent: "#854D0E" },
  { id: "minimal", label: "Minimal", desc: "Less is more", accent: "#6B7280" },
  { id: "bold", label: "Bold", desc: "Big & impactful", accent: "#DC2626" },
  { id: "elegant", label: "Elegant", desc: "Refined & polished", accent: "#7C3AED" },
] as const;

const PRESET_DEFAULTS: Record<string, Record<string, unknown>> = {
  modern: { cardStyle: "rounded", cardColumns: 2, buttonRadius: 999, headerStyle: "left", tabBarStyle: "pills", typography: { headingSize: "medium", bodySize: "medium" } },
  classic: { cardStyle: "sharp", cardColumns: 1, buttonRadius: 4, headerStyle: "left", tabBarStyle: "underline", typography: { headingSize: "large", bodySize: "medium" } },
  minimal: { cardStyle: "flat", cardColumns: 1, buttonRadius: 0, headerStyle: "centered", tabBarStyle: "underline", typography: { headingSize: "small", bodySize: "small" } },
  bold: { cardStyle: "rounded", cardColumns: 2, buttonRadius: 12, headerStyle: "centered", tabBarStyle: "pills", typography: { headingSize: "large", bodySize: "large" } },
  elegant: { cardStyle: "rounded", cardColumns: 2, buttonRadius: 8, headerStyle: "centered", tabBarStyle: "underline", typography: { headingSize: "medium", bodySize: "small" } },
};

interface DesignEditorProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export default function DesignEditor({ config, onChange }: DesignEditorProps) {
  const design = (config?.design ?? {}) as Record<string, unknown>;

  function updateDesign(field: string, value: unknown) {
    onChange({ ...config, design: { ...design, [field]: value } });
  }

  function applyPreset(presetId: string) {
    const defaults = PRESET_DEFAULTS[presetId];
    if (!defaults) return;
    onChange({ ...config, design: { preset: presetId, ...defaults } });
  }

  const typo = (design.typography ?? {}) as { headingSize?: string; bodySize?: string };

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-500">
        Choose a visual style. Presets give you a starting point — customize individual settings after.
      </p>

      {/* Presets */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Design Preset</h2>
        <div className="grid grid-cols-5 gap-3">
          {DESIGN_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-colors ${
                design.preset === p.id ? "border-blue-600 bg-gray-100" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="w-full h-1 rounded-full mb-3" style={{ backgroundColor: p.accent }} />
              <span className="text-sm font-medium text-gray-900">{p.label}</span>
              <span className="text-xs text-gray-400 mt-1">{p.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Card Style */}
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-3">Card Style</label>
        <div className="grid grid-cols-3 gap-3">
          {([
            { id: "rounded", label: "Rounded", cls: "rounded-xl" },
            { id: "sharp", label: "Sharp", cls: "rounded-none" },
            { id: "flat", label: "Flat", cls: "rounded-lg" },
          ] as const).map((s) => (
            <button
              key={s.id}
              onClick={() => updateDesign("cardStyle", s.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                design.cardStyle === s.id ? "border-blue-600 bg-gray-100" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className={`w-16 h-10 ${s.cls} ${s.id === "flat" ? "bg-gray-700" : "bg-gray-700 border border-gray-600"}`} />
              <span className="text-sm text-gray-900">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Button Shape */}
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-3">Button Shape</label>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">Square</span>
          <input
            type="range" min={0} max={24}
            value={typeof design.buttonRadius === "number" ? (design.buttonRadius as number) > 24 ? 24 : (design.buttonRadius as number) : 12}
            onChange={(e) => {
              const v = Number(e.target.value);
              updateDesign("buttonRadius", v === 24 ? 999 : v);
            }}
            className="flex-1 accent-blue-600"
          />
          <span className="text-xs text-gray-400">Pill</span>
        </div>
        <div className="mt-3 flex justify-center">
          <div
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium"
            style={{ borderRadius: typeof design.buttonRadius === "number" ? Math.min(design.buttonRadius as number, 24) : 12 }}
          >
            Preview Button
          </div>
        </div>
      </div>

      {/* Card Layout */}
      <div>
        <label className="block text-sm font-medium text-gray-500 mb-3">Card Layout</label>
        <div className="grid grid-cols-2 gap-3">
          {([1, 2] as const).map((cols) => (
            <button
              key={cols}
              onClick={() => updateDesign("cardColumns", cols)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                design.cardColumns === cols ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200 hover:border-gray-300 text-gray-600"
              }`}
            >
              <div className={cols === 1 ? "flex flex-col gap-1 w-8" : "grid grid-cols-2 gap-1 w-8"}>
                {Array.from({ length: cols === 1 ? 3 : 4 }).map((_, i) => (
                  <div key={i} className={`${cols === 1 ? "h-2" : "h-3"} bg-current rounded-sm opacity-40`} />
                ))}
              </div>
              <span className="text-sm font-medium">{cols === 1 ? "List (1 column)" : "Grid (2 columns)"}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Header & Tab Bar */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-3">Header Style</label>
          <div className="flex flex-col gap-2">
            {(["left", "centered"] as const).map((style) => (
              <button
                key={style}
                onClick={() => updateDesign("headerStyle", style)}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  design.headerStyle === style ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
              >
                {style === "left" ? "Left aligned" : "Centered"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-3">Tab Bar</label>
          <div className="flex flex-col gap-2">
            {(["pills", "underline"] as const).map((style) => (
              <button
                key={style}
                onClick={() => updateDesign("tabBarStyle", style)}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                  design.tabBarStyle === style ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
              >
                {style === "pills" ? "Pills" : "Underline"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-3">Heading Size</label>
          <div className="flex gap-2">
            {(["small", "medium", "large"] as const).map((size) => (
              <button
                key={size}
                onClick={() => updateDesign("typography", { ...typo, headingSize: size })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  (typo.headingSize ?? "medium") === size ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:text-gray-900"
                }`}
              >
                {size[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-3">Body Size</label>
          <div className="flex gap-2">
            {(["small", "medium", "large"] as const).map((size) => (
              <button
                key={size}
                onClick={() => updateDesign("typography", { ...typo, bodySize: size })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  (typo.bodySize ?? "medium") === size ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:text-gray-900"
                }`}
              >
                {size[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
