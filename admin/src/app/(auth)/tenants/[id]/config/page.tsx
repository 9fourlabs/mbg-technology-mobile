"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const TABS = ["Brand", "Tabs", "Template Config"];

export default function ConfigEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [configJson, setConfigJson] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading config...</p>
      </div>
    );
  }

  const brandConfig = config?.brand as Record<string, string> | undefined;
  const tabsConfig = config?.tabs as unknown[] | undefined;

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
            {brandConfig ? (
              <div className="space-y-3">
                {Object.entries(brandConfig).map(([key, value]) => (
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
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No brand config set.</p>
            )}
          </div>
        )}

        {activeTab === 1 && (
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

        {activeTab === 2 && (
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

      {/* Save */}
      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-800 px-3 py-2 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-900/30 border border-green-800 px-3 py-2 text-sm text-green-400 mb-4">
          Config saved successfully.
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
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Config"}
        </button>
      </div>
    </div>
  );
}
