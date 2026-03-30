"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ImageUploader from "@/components/ImageUploader";

const TABS = ["Brand", "Design", "Tabs", "Template Config"];

const DESIGN_PRESETS = [
  { id: "modern", label: "Modern", desc: "Clean & fresh", accent: "#2563EB" },
  { id: "classic", label: "Classic", desc: "Timeless & structured", accent: "#854D0E" },
  { id: "minimal", label: "Minimal", desc: "Less is more", accent: "#6B7280" },
  { id: "bold", label: "Bold", desc: "Big & impactful", accent: "#DC2626" },
  { id: "elegant", label: "Elegant", desc: "Refined & polished", accent: "#7C3AED" },
] as const;

const PRESET_DEFAULTS: Record<string, { cardStyle: string; cardColumns: number; buttonRadius: number; headerStyle: string; tabBarStyle: string; typography: { headingSize: string; bodySize: string } }> = {
  modern: { cardStyle: "rounded", cardColumns: 2, buttonRadius: 999, headerStyle: "left", tabBarStyle: "pills", typography: { headingSize: "medium", bodySize: "medium" } },
  classic: { cardStyle: "sharp", cardColumns: 1, buttonRadius: 4, headerStyle: "left", tabBarStyle: "underline", typography: { headingSize: "large", bodySize: "medium" } },
  minimal: { cardStyle: "flat", cardColumns: 1, buttonRadius: 0, headerStyle: "centered", tabBarStyle: "underline", typography: { headingSize: "small", bodySize: "small" } },
  bold: { cardStyle: "rounded", cardColumns: 2, buttonRadius: 12, headerStyle: "centered", tabBarStyle: "pills", typography: { headingSize: "large", bodySize: "large" } },
  elegant: { cardStyle: "rounded", cardColumns: 2, buttonRadius: 8, headerStyle: "centered", tabBarStyle: "underline", typography: { headingSize: "medium", bodySize: "small" } },
};

export default function ConfigEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [configJson, setConfigJson] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [prInfo, setPrInfo] = useState<{
    url: string;
    number: number;
  } | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("tenants")
        .select("config")
        .eq("id", id)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      setConfig(data.config ?? {});
      setConfigJson(JSON.stringify(data.config ?? {}, null, 2));
      setLoading(false);
    };
    loadConfig();
  }, [id]);

  const handleSaveDraft = async () => {
    setError(null);
    setSuccess(false);
    setPrInfo(null);
    setSaving(true);

    try {
      const parsed = JSON.parse(configJson);
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("tenants")
        .update({ config: parsed })
        .eq("id", id);

      if (updateError) {
        setError(updateError.message);
      } else {
        setConfig(parsed);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("Invalid JSON. Please check your syntax.");
    }
    setSaving(false);
  };

  const handleSaveAndDeploy = async () => {
    setError(null);
    setSuccess(false);
    setPrInfo(null);
    setDeploying(true);

    try {
      const parsed = JSON.parse(configJson);

      const res = await fetch(`/api/tenants/${id}/save-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: parsed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save and deploy config.");
      } else {
        setConfig(parsed);
        setPrInfo({ url: data.pr_url, number: data.pr_number });
      }
    } catch {
      setError("Invalid JSON or network error. Please check your syntax and try again.");
    }
    setDeploying(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading config...</p>
      </div>
    );
  }

  const brandConfig = config?.brand as Record<string, string> | undefined;
  const tabsConfig = config?.tabs as unknown[] | undefined;
  const designConfig = (config?.design ?? {}) as Record<string, unknown>;

  const updateDesign = (field: string, value: unknown) => {
    const updated = { ...config, design: { ...designConfig, [field]: value } };
    setConfig(updated);
    setConfigJson(JSON.stringify(updated, null, 2));
  };

  const applyPreset = (presetId: string) => {
    const defaults = PRESET_DEFAULTS[presetId];
    if (!defaults) return;
    const updated = { ...config, design: { preset: presetId, ...defaults } };
    setConfig(updated);
    setConfigJson(JSON.stringify(updated, null, 2));
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/tenants" className="hover:text-white transition-colors">
          Tenants
        </Link>
        <span>/</span>
        <Link
          href={`/tenants/${id}`}
          className="hover:text-white transition-colors"
        >
          {id}
        </Link>
        <span>/</span>
        <span className="text-white">Config</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">
          Configuration Editor
        </h1>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-800">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === i
                ? "border-[#2563EB] text-white"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-6 mb-6">
        {activeTab === 0 && (
          <div>
            <h2 className="text-base font-semibold text-white mb-4">
              Brand Settings
            </h2>

            {/* Logo uploader */}
            <div className="mb-6">
              <ImageUploader
                tenantId={id}
                category="logo"
                label="Logo"
                currentUrl={brandConfig?.logoUri ?? brandConfig?.logoUrl}
                onUpload={(url) => {
                  const updated = {
                    ...config,
                    brand: { ...(brandConfig ?? {}), logoUri: url },
                  };
                  setConfig(updated);
                  setConfigJson(JSON.stringify(updated, null, 2));
                }}
              />
            </div>

            {brandConfig ? (
              <div className="space-y-3">
                {Object.entries(brandConfig).map(([key, value]) => {
                  // Skip logoUri/logoUrl since we show the uploader above
                  if (key === "logoUri" || key === "logoUrl") return null;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-36 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      {key.toLowerCase().includes("color") ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-700"
                            style={{ backgroundColor: value }}
                          />
                          <span className="text-sm text-gray-300 font-mono">
                            {value}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-300">{value}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No brand config set.</p>
            )}
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-8">
            {/* Preset Picker */}
            <div>
              <h2 className="text-base font-semibold text-white mb-4">Design Preset</h2>
              <div className="grid grid-cols-5 gap-3">
                {DESIGN_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-colors ${
                      designConfig.preset === p.id
                        ? "border-[#2563EB] bg-gray-800"
                        : "border-gray-800 hover:border-gray-700"
                    }`}
                  >
                    <div className="w-full h-1 rounded-full mb-3" style={{ backgroundColor: p.accent }} />
                    <span className="text-sm font-medium text-white">{p.label}</span>
                    <span className="text-xs text-gray-500 mt-1">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card Style */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Card Style</label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { id: "rounded", label: "Rounded", preview: "rounded-xl" },
                  { id: "sharp", label: "Sharp", preview: "rounded-none" },
                  { id: "flat", label: "Flat", preview: "rounded-lg" },
                ] as const).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateDesign("cardStyle", s.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                      designConfig.cardStyle === s.id
                        ? "border-[#2563EB] bg-gray-800"
                        : "border-gray-800 hover:border-gray-700"
                    }`}
                  >
                    <div className={`w-16 h-10 ${s.preview} ${s.id === "flat" ? "bg-gray-700" : "bg-gray-700 border border-gray-600"}`} />
                    <span className="text-sm text-white">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Button Shape */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Button Shape</label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">Square</span>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={typeof designConfig.buttonRadius === "number" ? designConfig.buttonRadius > 24 ? 24 : designConfig.buttonRadius : 12}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    updateDesign("buttonRadius", v === 24 ? 999 : v);
                  }}
                  className="flex-1 accent-[#2563EB]"
                />
                <span className="text-xs text-gray-500">Pill</span>
              </div>
              <div className="mt-3 flex justify-center">
                <div
                  className="px-6 py-2 bg-[#2563EB] text-white text-sm font-medium"
                  style={{ borderRadius: typeof designConfig.buttonRadius === "number" ? Math.min(designConfig.buttonRadius as number, 24) : 12 }}
                >
                  Preview Button
                </div>
              </div>
            </div>

            {/* Card Layout */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Card Layout</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { cols: 1, label: "List (1 column)", icon: (
                    <div className="flex flex-col gap-1 w-8">
                      <div className="h-2 bg-gray-500 rounded-sm" />
                      <div className="h-2 bg-gray-500 rounded-sm" />
                      <div className="h-2 bg-gray-500 rounded-sm" />
                    </div>
                  )},
                  { cols: 2, label: "Grid (2 columns)", icon: (
                    <div className="grid grid-cols-2 gap-1 w-8">
                      <div className="h-3 bg-gray-500 rounded-sm" />
                      <div className="h-3 bg-gray-500 rounded-sm" />
                      <div className="h-3 bg-gray-500 rounded-sm" />
                      <div className="h-3 bg-gray-500 rounded-sm" />
                    </div>
                  )},
                ] as const).map((opt) => (
                  <button
                    key={opt.cols}
                    onClick={() => updateDesign("cardColumns", opt.cols)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                      designConfig.cardColumns === opt.cols
                        ? "bg-[#2563EB] border-[#2563EB] text-white"
                        : "border-gray-800 hover:border-gray-700 text-gray-300"
                    }`}
                  >
                    {opt.icon}
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Header Alignment */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Header Style</label>
              <div className="grid grid-cols-2 gap-3">
                {(["left", "centered"] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => updateDesign("headerStyle", style)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                      designConfig.headerStyle === style
                        ? "bg-[#2563EB] border-[#2563EB] text-white"
                        : "border-gray-800 hover:border-gray-700 text-gray-300"
                    }`}
                  >
                    <span className="text-sm font-medium capitalize">{style === "left" ? "Left aligned" : "Centered"}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Bar Style */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Tab Bar</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: "pills", label: "Pills", preview: (
                    <div className="flex gap-1">
                      <div className="px-2 py-0.5 rounded-full bg-[#2563EB] text-[10px] text-white">Tab</div>
                      <div className="px-2 py-0.5 rounded-full bg-gray-700 text-[10px] text-gray-400">Tab</div>
                    </div>
                  )},
                  { id: "underline", label: "Underline", preview: (
                    <div className="flex gap-2">
                      <div className="border-b-2 border-[#2563EB] text-[10px] text-white pb-0.5">Tab</div>
                      <div className="border-b-2 border-transparent text-[10px] text-gray-400 pb-0.5">Tab</div>
                    </div>
                  )},
                ] as const).map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => updateDesign("tabBarStyle", opt.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                      designConfig.tabBarStyle === opt.id
                        ? "border-[#2563EB] bg-gray-800"
                        : "border-gray-800 hover:border-gray-700"
                    }`}
                  >
                    {opt.preview}
                    <span className="text-sm text-white">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Typography */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Heading Size</label>
              <div className="flex gap-2">
                {(["small", "medium", "large"] as const).map((size) => {
                  const typo = designConfig.typography as { headingSize?: string; bodySize?: string } | undefined;
                  return (
                    <button
                      key={size}
                      onClick={() => updateDesign("typography", { ...(typo ?? { headingSize: "medium", bodySize: "medium" }), headingSize: size })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        (typo?.headingSize ?? "medium") === size
                          ? "bg-[#2563EB] text-white"
                          : "bg-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      {size === "small" ? "S" : size === "medium" ? "M" : "L"}
                    </button>
                  );
                })}
              </div>
              <label className="block text-sm font-medium text-gray-400 mb-3 mt-4">Body Size</label>
              <div className="flex gap-2">
                {(["small", "medium", "large"] as const).map((size) => {
                  const typo = designConfig.typography as { headingSize?: string; bodySize?: string } | undefined;
                  return (
                    <button
                      key={size}
                      onClick={() => updateDesign("typography", { ...(typo ?? { headingSize: "medium", bodySize: "medium" }), bodySize: size })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        (typo?.bodySize ?? "medium") === size
                          ? "bg-[#2563EB] text-white"
                          : "bg-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      {size === "small" ? "S" : size === "medium" ? "M" : "L"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div>
            <h2 className="text-base font-semibold text-white mb-4">
              Tab Configuration
            </h2>
            {tabsConfig && tabsConfig.length > 0 ? (
              <div className="space-y-2">
                {tabsConfig.map((tab, i) => {
                  const t = tab as Record<string, unknown>;
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border border-gray-700"
                    >
                      <div>
                        <span className="text-sm text-white font-medium">
                          {String(t.label ?? t.title ?? `Tab ${i + 1}`)}
                        </span>
                        {"type" in t && t.type ? (
                          <span className="ml-2 text-xs text-gray-500">
                            ({String(t.type)})
                          </span>
                        ) : null}
                      </div>
                      <span className="text-xs text-gray-500">#{i + 1}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No tabs configured yet.</p>
            )}
          </div>
        )}

        {activeTab === 3 && (
          <div>
            <h2 className="text-base font-semibold text-white mb-4">
              Raw JSON Config
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Edit the full configuration JSON directly. Be careful with changes.
            </p>
            <textarea
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              rows={20}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-y"
              spellCheck={false}
            />
          </div>
        )}
      </div>

      {/* Status banners */}
      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-800 px-3 py-2 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-900/30 border border-green-800 px-3 py-2 text-sm text-green-400 mb-4">
          Draft saved successfully.
        </div>
      )}
      {prInfo && (
        <div className="rounded-lg bg-green-900/30 border border-green-800 px-3 py-2 text-sm text-green-400 mb-4">
          Config saved! PR opened:{" "}
          <a
            href={prInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium hover:text-green-300"
          >
            #{prInfo.number}
          </a>
        </div>
      )}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => router.push(`/tenants/${id}`)}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveDraft}
          disabled={saving || deploying}
          className="px-6 py-2.5 rounded-lg border border-gray-700 hover:border-gray-600 text-sm font-medium text-gray-300 hover:text-white transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>
        <button
          onClick={handleSaveAndDeploy}
          disabled={saving || deploying}
          className="px-6 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          {deploying ? "Saving & committing..." : "Save & Deploy"}
        </button>
      </div>
    </div>
  );
}
