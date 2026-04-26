"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BrandEditor from "./brand-editor";
import DesignEditor from "./design-editor";
import TabsEditor from "./tabs-editor";
import TemplateSettingsEditor from "./template-settings-editor";
import AppStoreEditor from "./appstore-editor";
import PhoneMockup from "./phone-mockup";
import DeploymentStatus from "./deployment-status";
import TenantTabBar from "@/components/TenantTabBar";
import { hashConfig } from "@/lib/config-hash";

type LatestBuild = { config_hash: string | null; created_at: string } | null;

const TABS = ["Brand", "Design", "Pages", "Features", "App Store", "Advanced"];

export default function ConfigEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [configJson, setConfigJson] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isCustomApp, setIsCustomApp] = useState(false);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>(id);
  const [appType, setAppType] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [prInfo, setPrInfo] = useState<{ url: string; number: number } | null>(null);
  // Tenant-level fields (stored separately from JSONB config)
  const [expoProjectId, setExpoProjectId] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [draftHash, setDraftHash] = useState<string | null>(null);
  const [latestPreview, setLatestPreview] = useState<LatestBuild>(null);
  const [latestProduction, setLatestProduction] = useState<LatestBuild>(null);

  useEffect(() => {
    const loadConfig = async () => {
      const res = await fetch(`/api/tenants/${id}/config`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `HTTP ${res.status}`);
        setLoading(false);
        return;
      }
      const { tenant, builds } = (await res.json()) as {
        tenant: {
          config: Record<string, unknown> | null;
          app_type: string;
          repo_url: string | null;
          business_name: string | null;
          expo_project_id: string | null;
          supabase_url: string | null;
          supabase_anon_key: string | null;
          updated_at: string | null;
        };
        builds: Array<{ profile: string; config_hash: string | null; created_at: string }>;
      };

      setTenantName(tenant.business_name || id);
      setAppType(tenant.app_type);

      if (tenant.app_type === "custom") {
        setIsCustomApp(true);
        setRepoUrl(tenant.repo_url);
        setLoading(false);
        return;
      }

      setConfig(tenant.config ?? {});
      setConfigJson(JSON.stringify(tenant.config ?? {}, null, 2));
      setExpoProjectId(tenant.expo_project_id ?? "");
      setSupabaseUrl(tenant.supabase_url ?? "");
      setSupabaseAnonKey(tenant.supabase_anon_key ?? "");
      setUpdatedAt(tenant.updated_at ?? null);

      const preview = builds.find((b) => b.profile === "preview") ?? null;
      const production = builds.find((b) => b.profile === "production") ?? null;
      setLatestPreview(preview);
      setLatestProduction(production);

      setLoading(false);
    };
    loadConfig();
  }, [id]);

  // Recompute the draft hash whenever the config changes in memory.
  useEffect(() => {
    if (!config) {
      setDraftHash(null);
      return;
    }
    let cancelled = false;
    hashConfig(config).then((h) => {
      if (!cancelled) setDraftHash(h);
    });
    return () => {
      cancelled = true;
    };
  }, [config]);

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
      const parsed = activeTab === 5 ? JSON.parse(configJson) : config;
      const res = await fetch(`/api/tenants/${id}/save-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: parsed,
          expo_project_id: expoProjectId || null,
          supabase_url: supabaseUrl || null,
          supabase_anon_key: supabaseAnonKey || null,
          draft_only: true, // skip the GitHub PR side-effect
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `HTTP ${res.status}`);
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
      const parsed = activeTab === 5 ? JSON.parse(configJson) : config;

      const res = await fetch(`/api/tenants/${id}/save-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: parsed,
          expo_project_id: expoProjectId || null,
          supabase_url: supabaseUrl || null,
          supabase_anon_key: supabaseAnonKey || null,
          expected_updated_at: updatedAt,
        }),
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
        <TenantTabBar tenantId={id} tenantName={tenantName} appType={appType} />
        <div className="rounded-xl bg-white border border-gray-200 p-8 text-center">
          <span className="text-4xl mb-4 block">&#x1F4BB;</span>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Custom App</h2>
          <p className="text-sm text-gray-500 mb-4">
            This is a custom app — its code lives in an external repository. Edit the code directly in the repo.
          </p>
          {repoUrl && (
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors"
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
      <TenantTabBar tenantId={id} tenantName={tenantName} appType={appType} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Configuration Editor</h1>
      </div>

      {/* Split layout: Editor + Phone Mockup */}
      <div className="flex gap-6 items-start">
        {/* Left: Editor */}
        <div className="flex-1 min-w-0">
          {/* Tab Bar */}
          <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                  activeTab === i
                    ? "border-blue-600 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="rounded-xl bg-white border border-gray-200 p-6 mb-6">
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
              <TemplateSettingsEditor
                config={config}
                onChange={handleConfigChange}
                supabaseUrl={supabaseUrl}
                supabaseAnonKey={supabaseAnonKey}
                onSupabaseChange={(field, value) => {
                  if (field === "supabaseUrl") setSupabaseUrl(value);
                  else setSupabaseAnonKey(value);
                }}
              />
            )}
            {activeTab === 4 && config && (
              <AppStoreEditor
                tenantId={id}
                config={config as any}
                onChange={handleConfigChange as any}
                expoProjectId={expoProjectId}
                onExpoProjectIdChange={setExpoProjectId}
              />
            )}
            {activeTab === 5 && (
              <div>
                <h2 className="text-base font-semibold text-gray-900 mb-4">Advanced Config</h2>
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
                  className="w-full rounded-lg bg-gray-100 border border-gray-300 px-4 py-3 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* Status banners */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-50 border border-green-200 px-3 py-2 text-sm text-emerald-700 mb-4">
              Draft saved successfully.
            </div>
          )}
          {prInfo && (
            <div className="rounded-lg bg-emerald-50 border border-green-200 px-3 py-2 text-sm text-emerald-700 mb-4">
              Changes saved! Building preview...
              <a href={prInfo.url} target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-emerald-600 ml-1">
                View details
              </a>
            </div>
          )}

          {/* Deployment status */}
          <DeploymentStatus
            draftHash={draftHash}
            latestPreview={latestPreview}
            latestProduction={latestProduction}
          />

          {/* Save actions */}
          <div className="rounded-lg bg-gray-50 border border-gray-300 px-4 py-3 mb-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong className="text-gray-600">Save Draft</strong> saves your changes.{" "}
              <strong className="text-gray-600">Save &amp; Build</strong> saves and starts a new preview build.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => router.push(`/tenants/${id}`)}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={saving || deploying}
              className="px-6 py-2.5 rounded-lg border border-gray-300 hover:border-gray-400 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={handleSaveAndDeploy}
              disabled={saving || deploying}
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              {deploying ? "Saving & building..." : "Save & Build"}
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
