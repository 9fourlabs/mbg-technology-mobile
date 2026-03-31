"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import BrandEditor from "./brand-editor";
import DesignEditor from "./design-editor";
import TabsEditor from "./tabs-editor";
import TemplateSettingsEditor from "./template-settings-editor";
import PhoneMockup from "./phone-mockup";

const TABS = ["Brand", "Design", "Tabs & Content", "Template Settings", "Raw JSON"];

export default function ConfigEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [configJson, setConfigJson] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isCustomApp, setIsCustomApp] = useState(false);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [prInfo, setPrInfo] = useState<{ url: string; number: number } | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("tenants")
        .select("config, app_type, repo_url")
        .eq("id", id)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      if (data.app_type === "custom") {
        setIsCustomApp(true);
        setRepoUrl(data.repo_url);
        setLoading(false);
        return;
      }

      setConfig(data.config ?? {});
      setConfigJson(JSON.stringify(data.config ?? {}, null, 2));
      setLoading(false);
    };
    loadConfig();
  }, [id]);

  // Keep JSON in sync when config changes from editors
  function handleConfigChange(updated: Record<string, unknown>) {
    setConfig(updated);
    setConfigJson(JSON.stringify(updated, null, 2));
  }

  const handleSaveDraft = async () => {
    setError(null);
    setSuccess(false);
    setPrInfo(null);
    setSaving(true);

    try {
      const parsed = activeTab === 4 ? JSON.parse(configJson) : config;
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("tenants")
        .update({ config: parsed })
        .eq("id", id);

      if (updateError) {
        setError(updateError.message);
      } else {
        setConfig(parsed);
        setConfigJson(JSON.stringify(parsed, null, 2));
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
      const parsed = activeTab === 4 ? JSON.parse(configJson) : config;

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
        setConfigJson(JSON.stringify(parsed, null, 2));
        setPrInfo({ url: data.pr_url, number: data.pr_number });
      }
    } catch {
      setError("Invalid JSON or network error.");
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

  if (isCustomApp) {
    return (
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/tenants" className="hover:text-white transition-colors">Tenants</Link>
          <span>/</span>
          <Link href={`/tenants/${id}`} className="hover:text-white transition-colors">{id}</Link>
          <span>/</span>
          <span className="text-white">Config</span>
        </div>
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-8 text-center">
          <span className="text-4xl mb-4 block">&#x1F4BB;</span>
          <h2 className="text-lg font-semibold text-white mb-2">Custom App</h2>
          <p className="text-sm text-gray-400 mb-4">
            This is a custom app — its code lives in an external repository. Edit the code directly in the repo.
          </p>
          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-sm font-medium text-white transition-colors"
            >
              Open Repository
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/tenants" className="hover:text-white transition-colors">Tenants</Link>
        <span>/</span>
        <Link href={`/tenants/${id}`} className="hover:text-white transition-colors">{id}</Link>
        <span>/</span>
        <span className="text-white">Config</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-white">Configuration Editor</h1>
      </div>

      {/* Split layout: Editor + Phone Mockup */}
      <div className="flex gap-6 items-start">
        {/* Left: Editor */}
        <div className="flex-1 min-w-0">
          {/* Tab Bar */}
          <div className="flex gap-1 mb-6 border-b border-gray-800 overflow-x-auto">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
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
            {activeTab === 0 && config && (
              <BrandEditor tenantId={id} config={config} onChange={handleConfigChange} />
            )}
            {activeTab === 1 && config && (
              <DesignEditor config={config} onChange={handleConfigChange} />
            )}
            {activeTab === 2 && config && (
              <TabsEditor tenantId={id} config={config} onChange={handleConfigChange} />
            )}
            {activeTab === 3 && config && (
              <TemplateSettingsEditor config={config} onChange={handleConfigChange} />
            )}
            {activeTab === 4 && (
              <div>
                <h2 className="text-base font-semibold text-white mb-4">Raw JSON Config</h2>
                <p className="text-xs text-gray-500 mb-3">
                  Edit the full configuration JSON directly. Changes here are reflected when you switch tabs.
                </p>
                <textarea
                  value={configJson}
                  onChange={(e) => {
                    setConfigJson(e.target.value);
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setConfig(parsed);
                    } catch {
                      // Invalid JSON while typing — don't update config
                    }
                  }}
                  rows={24}
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
              <a href={prInfo.url} target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-green-300">
                #{prInfo.number}
              </a>
            </div>
          )}

          {/* Save actions */}
          <div className="rounded-lg bg-gray-800/50 border border-gray-700 px-4 py-3 mb-4">
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong className="text-gray-300">Save Draft</strong> saves to the database without building.{" "}
              <strong className="text-gray-300">Save &amp; Deploy</strong> saves and creates a PR to trigger a new build.
            </p>
          </div>
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

        {/* Right: Phone Mockup */}
        <div className="sticky top-8 hidden xl:block">
          {config && <PhoneMockup config={config} />}
        </div>
      </div>
    </div>
  );
}
