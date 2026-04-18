"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";

const TEMPLATE_TYPES = [
  { id: "informational", label: "Info Pages", emoji: "\u{1F4CB}", color: "border-gray-500", description: "A simple branded app with pages of content. Perfect for businesses that want a mobile presence." },
  { id: "authenticated", label: "Member Portal", emoji: "\u{1F512}", color: "border-blue-500", description: "Content with user login and accounts. Good for membership organizations and client portals." },
  { id: "booking", label: "Booking & Scheduling", emoji: "\u{1F4C5}", color: "border-green-500", description: "Lets customers book appointments and manage their schedule. Ideal for salons, consultants, trainers." },
  { id: "commerce", label: "Online Store", emoji: "\u{1F6D2}", color: "border-yellow-500", description: "An online store with product catalog, shopping cart, and checkout. For retail, food, merchandise." },
  { id: "loyalty", label: "Loyalty & Rewards", emoji: "\u{2B50}", color: "border-purple-500", description: "A digital loyalty card with points, rewards, and tier progression. Great for coffee shops, restaurants." },
  { id: "content", label: "Blog & Articles", emoji: "\u{1F4F0}", color: "border-orange-500", description: "A content feed with articles, categories, and bookmarks. For newsletters, blogs, training content." },
  { id: "forms", label: "Forms & Surveys", emoji: "\u{1F4DD}", color: "border-teal-500", description: "Custom forms for collecting information from users. Insurance intake, surveys, applications." },
  { id: "directory", label: "Directory & Listings", emoji: "\u{1F4D6}", color: "border-indigo-500", description: "A searchable directory with categories and detail pages. Member directories, location finders." },
];

const TEMPLATE_STEPS = ["Choose Type", "Pick a Template", "Name Your App", "Colors & Logo", "Visual Style", "Review & Create"];
const CUSTOM_STEPS = ["Choose Type", "Name Your App", "Repository", "Review & Create"];

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

interface DesignData {
  preset: string;
  cardStyle: string;
  cardColumns: number;
  buttonRadius: number;
  headerStyle: string;
  tabBarStyle: string;
  typography: { headingSize: string; bodySize: string };
}

interface BriefData {
  industry: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryGoal: string;
  specialRequirements: string;
  targetLaunchDate: string;
}

interface FormData {
  app_type: "template" | "custom";
  template_type: string;
  tenant_id: string;
  business_name: string;
  primary_color: string;
  background_color: string;
  text_color: string;
  logo_url: string;
  design: DesignData;
  repo_url: string;
  repo_branch: string;
  brief: BriefData;
}

export default function NewTenantPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [idAvailable, setIdAvailable] = useState<boolean | null>(null);
  const [idChecking, setIdChecking] = useState(false);
  const idCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [form, setForm] = useState<FormData>({
    app_type: "template",
    template_type: "",
    tenant_id: "",
    business_name: "",
    primary_color: "#2563EB",
    background_color: "#030712",
    text_color: "#FFFFFF",
    logo_url: "",
    design: {
      preset: "modern",
      cardStyle: "rounded",
      cardColumns: 2,
      buttonRadius: 999,
      headerStyle: "left",
      tabBarStyle: "pills",
      typography: { headingSize: "medium", bodySize: "medium" },
    },
    repo_url: "",
    repo_branch: "main",
    brief: {
      industry: "",
      primaryContactName: "",
      primaryContactEmail: "",
      primaryGoal: "",
      specialRequirements: "",
      targetLaunchDate: "",
    },
  });

  const updateBrief = (patch: Partial<BriefData>) => {
    setForm((prev) => ({ ...prev, brief: { ...prev.brief, ...patch } }));
  };

  const isCustom = form.app_type === "custom";
  const STEPS = isCustom ? CUSTOM_STEPS : TEMPLATE_STEPS;

  // Debounced tenant ID availability check
  useEffect(() => {
    if (idCheckTimer.current) clearTimeout(idCheckTimer.current);
    if (!form.tenant_id || form.tenant_id.length < 3 || !validateTenantId(form.tenant_id)) {
      setIdAvailable(null);
      return;
    }
    setIdChecking(true);
    idCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/tenants/check-id?id=${encodeURIComponent(form.tenant_id)}`);
        const data = await res.json();
        setIdAvailable(data.available);
      } catch {
        setIdAvailable(null);
      } finally {
        setIdChecking(false);
      }
    }, 500);
    return () => { if (idCheckTimer.current) clearTimeout(idCheckTimer.current); };
  }, [form.tenant_id]);

  const updateForm = (updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    if (step === 0) return true; // app_type always has a default

    if (isCustom) {
      switch (step) {
        case 1: return form.tenant_id.length >= 3 && form.business_name.length >= 1 && idAvailable !== false;
        case 2: return form.repo_url.length > 0;
        case 3: return true;
        default: return false;
      }
    } else {
      switch (step) {
        case 1: return form.template_type !== "";
        case 2: return form.tenant_id.length >= 3 && form.business_name.length >= 1 && idAvailable !== false;
        case 3: return form.primary_color !== "";
        case 4: return form.design.preset !== "";
        case 5: return true;
        default: return false;
      }
    }
  };

  const updateDesign = (field: string, value: unknown) => {
    setForm((prev) => ({
      ...prev,
      design: { ...prev.design, [field]: value } as DesignData,
    }));
  };

  const applyPreset = (presetId: string) => {
    const defaults = PRESET_DEFAULTS[presetId];
    if (!defaults) return;
    setForm((prev) => ({
      ...prev,
      design: { preset: presetId, ...defaults },
    }));
  };

  const validateTenantId = (id: string) => {
    return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(id) && id.length >= 3;
  };

  const [successPrUrl, setSuccessPrUrl] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    setCreating(true);

    try {
      const payload = isCustom
        ? {
            tenant_id: form.tenant_id,
            business_name: form.business_name,
            app_type: "custom",
            repo_url: form.repo_url,
            repo_branch: form.repo_branch,
            brief: form.brief,
          }
        : {
            tenant_id: form.tenant_id,
            template_type: form.template_type,
            business_name: form.business_name,
            app_type: "template",
            brand: {
              primaryColor: form.primary_color,
              backgroundColor: form.background_color,
              textColor: form.text_color,
              logoUrl: form.logo_url,
            },
            design: form.design,
            brief: form.brief,
          };

      const res = await fetch("/api/tenants/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create tenant.");
        setCreating(false);
        return;
      }

      // Show success banner with PR link (template) or redirect immediately (custom)
      if (data.pr_url) {
        setSuccessPrUrl(data.pr_url);
        setTimeout(() => {
          router.push(`/tenants/${form.tenant_id}`);
        }, 3000);
      } else {
        router.push(`/tenants/${form.tenant_id}`);
      }
    } catch (err) {
      setError("Failed to create tenant. Please try again.");
      setCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create a New Client App</h1>
        <p className="text-sm text-gray-500 mt-1">
          Set up a mobile app for your client in a few easy steps.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                i === step
                  ? "bg-blue-600 text-white"
                  : i < step
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              {i < step ? "\u2713" : i + 1}
            </div>
            <span
              className={`text-sm hidden sm:block ${
                i === step ? "text-gray-900 font-medium" : "text-gray-500"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px bg-gray-100 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-xl bg-white border border-gray-200 p-6">
        {/* Step 0: App Type */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">What type of app?</h2>
            <p className="text-sm text-gray-500 mb-4">
              Choose whether to use a pre-built template or connect a custom codebase.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => updateForm({ app_type: "template" })}
                className={`flex items-start gap-3 p-5 rounded-xl border-2 text-left transition-colors ${
                  form.app_type === "template" ? "border-blue-600 bg-gray-100" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-2xl mt-0.5">&#x1F4CB;</span>
                <div>
                  <span className="text-sm font-medium text-gray-900 block">Template App</span>
                  <span className="text-xs text-gray-500 mt-1 block leading-relaxed">
                    Use a pre-built template with config-driven branding, tabs, and content. No coding needed.
                  </span>
                </div>
              </button>
              <button
                onClick={() => updateForm({ app_type: "custom" })}
                className={`flex items-start gap-3 p-5 rounded-xl border-2 text-left transition-colors ${
                  form.app_type === "custom" ? "border-blue-600 bg-gray-100" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-2xl mt-0.5">&#x1F4BB;</span>
                <div>
                  <span className="text-sm font-medium text-gray-900 block">Custom App</span>
                  <span className="text-xs text-gray-500 mt-1 block leading-relaxed">
                    Connect an existing Expo/React Native repo. Build and deploy it through this admin panel.
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Template Step 1: Template selection */}
        {!isCustom && step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Choose a template
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Each template is a different type of app. Pick the one that best matches what your client needs.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATE_TYPES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => updateForm({ template_type: template.id })}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                    form.template_type === template.id
                      ? `${template.color} bg-gray-100`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-2xl mt-0.5">{template.emoji}</span>
                  <div>
                    <span className="text-sm font-medium text-gray-900 block">
                      {template.label}
                    </span>
                    <span className="text-xs text-gray-500 mt-1 block leading-relaxed">
                      {template.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Step 1 / Template Step 2: Identity */}
        {((isCustom && step === 1) || (!isCustom && step === 2)) && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Client details
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Tell us about your client. This information is used to set up their app.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                URL Slug
              </label>
              <input
                type="text"
                value={form.tenant_id}
                onChange={(e) =>
                  updateForm({
                    tenant_id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  })
                }
                placeholder="acme-dental"
                className="w-full rounded-lg bg-gray-100 border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be your app&apos;s unique identifier. Use something like &quot;acme-dental&quot; or &quot;toms-burgers&quot;. Lowercase, hyphens only. Min 3 characters.
              </p>
              {form.tenant_id.length > 0 && !validateTenantId(form.tenant_id) && (
                <p className="text-xs text-red-600 mt-1">
                  Invalid tenant ID format.
                </p>
              )}
              {form.tenant_id.length >= 3 && validateTenantId(form.tenant_id) && (
                <p className={`text-xs mt-1 ${idChecking ? "text-gray-400" : idAvailable === true ? "text-emerald-600" : idAvailable === false ? "text-red-600" : "text-gray-400"}`}>
                  {idChecking ? "Checking availability..." : idAvailable === true ? "✓ Available" : idAvailable === false ? "✗ This ID is already taken" : ""}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Business Name
              </label>
              <input
                type="text"
                value={form.business_name}
                onChange={(e) => updateForm({ business_name: e.target.value })}
                placeholder="My Business"
                className="w-full rounded-lg bg-gray-100 border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Project brief — optional but highly recommended */}
            <details className="group mt-4 rounded-lg border border-gray-200 bg-gray-50">
              <summary className="cursor-pointer list-none flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">Project brief</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Optional. Capture the client&apos;s goals and requirements so they live with the tenant record.
                  </div>
                </div>
                <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-4 pb-4 pt-2 space-y-3 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Industry</label>
                    <input
                      type="text"
                      value={form.brief.industry}
                      onChange={(e) => updateBrief({ industry: e.target.value })}
                      placeholder="e.g. dentistry, retail, fitness"
                      className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Target launch date</label>
                    <input
                      type="date"
                      value={form.brief.targetLaunchDate}
                      onChange={(e) => updateBrief({ targetLaunchDate: e.target.value })}
                      className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Primary contact name</label>
                    <input
                      type="text"
                      value={form.brief.primaryContactName}
                      onChange={(e) => updateBrief({ primaryContactName: e.target.value })}
                      placeholder="Jane Smith"
                      className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Primary contact email</label>
                    <input
                      type="email"
                      value={form.brief.primaryContactEmail}
                      onChange={(e) => updateBrief({ primaryContactEmail: e.target.value })}
                      placeholder="jane@client.com"
                      className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Primary goal</label>
                  <input
                    type="text"
                    value={form.brief.primaryGoal}
                    onChange={(e) => updateBrief({ primaryGoal: e.target.value })}
                    placeholder="What does success look like for this app?"
                    className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Special requirements</label>
                  <textarea
                    rows={3}
                    value={form.brief.specialRequirements}
                    onChange={(e) => updateBrief({ specialRequirements: e.target.value })}
                    placeholder="Integrations, compliance (HIPAA, PCI), third-party tools, accessibility, etc."
                    className="w-full rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  />
                </div>
              </div>
            </details>
          </div>
        )}

        {/* Custom Step 2: Repository */}
        {isCustom && step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Repository</h2>
            <p className="text-sm text-gray-500 mb-4">
              Point to the GitHub repo containing your Expo/React Native app.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">GitHub Repo URL</label>
              <input
                type="url"
                value={form.repo_url}
                onChange={(e) => updateForm({ repo_url: e.target.value })}
                placeholder="https://github.com/org/repo"
                className="w-full rounded-lg bg-gray-100 border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be a public repo or one accessible with your GitHub token.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Branch</label>
              <input
                type="text"
                value={form.repo_branch}
                onChange={(e) => updateForm({ repo_branch: e.target.value })}
                placeholder="main"
                className="w-full rounded-lg bg-gray-100 border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="rounded-lg bg-gray-100/50 border border-gray-300 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Requirements</h3>
              <ul className="space-y-1.5 text-xs text-gray-500">
                <li>&#x2022; Repo must have <code className="text-gray-600">eas.json</code> and <code className="text-gray-600">app.config.ts</code> (or app.json)</li>
                <li>&#x2022; Dependencies installable via <code className="text-gray-600">npm ci</code></li>
                <li>&#x2022; EAS project must be under the MBG Expo org (or use a shared EXPO_TOKEN)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Custom Step 3: Review */}
        {isCustom && step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Review & Create</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-500">App Type</span>
                <span className="text-sm text-gray-900">Custom App</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-500">Tenant ID</span>
                <span className="text-sm text-gray-900 font-mono">{form.tenant_id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-500">Business Name</span>
                <span className="text-sm text-gray-900">{form.business_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-500">Repository</span>
                <span className="text-sm text-blue-600 font-mono truncate max-w-xs">{form.repo_url}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-500">Branch</span>
                <span className="text-sm text-gray-900 font-mono">{form.repo_branch}</span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Template Step 3: Brand */}
        {!isCustom && step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Brand basics
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              These colors define how your client&apos;s app looks. The primary color is used for buttons and highlights. Background and text colors set the overall theme.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) =>
                      updateForm({ primary_color: e.target.value })
                    }
                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={form.primary_color}
                    onChange={(e) =>
                      updateForm({ primary_color: e.target.value })
                    }
                    className="flex-1 rounded-lg bg-gray-100 border border-gray-300 px-3 py-2.5 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.background_color}
                    onChange={(e) =>
                      updateForm({ background_color: e.target.value })
                    }
                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={form.background_color}
                    onChange={(e) =>
                      updateForm({ background_color: e.target.value })
                    }
                    className="flex-1 rounded-lg bg-gray-100 border border-gray-300 px-3 py-2.5 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">
                  Text Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.text_color}
                    onChange={(e) =>
                      updateForm({ text_color: e.target.value })
                    }
                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={form.text_color}
                    onChange={(e) =>
                      updateForm({ text_color: e.target.value })
                    }
                    className="flex-1 rounded-lg bg-gray-100 border border-gray-300 px-3 py-2.5 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            {/* Logo upload */}
            {form.tenant_id ? (
              <ImageUploader
                tenantId={form.tenant_id}
                category="logo"
                label="Logo (optional)"
                currentUrl={form.logo_url || undefined}
                onUpload={(url) => updateForm({ logo_url: url })}
              />
            ) : (
              <p className="text-sm text-gray-500">
                Enter a Tenant ID in the previous step to enable logo upload.
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Or enter URL directly
              </label>
              <input
                type="url"
                value={form.logo_url}
                onChange={(e) => updateForm({ logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-lg bg-gray-100 border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* Preview */}
            <div className="mt-4 p-4 rounded-lg border border-gray-300">
              <p className="text-xs text-gray-500 mb-2">Preview</p>
              <div
                className="rounded-lg p-4 flex items-center gap-3"
                style={{ backgroundColor: form.background_color }}
              >
                {form.logo_url && (
                  <img
                    src={form.logo_url}
                    alt="Logo"
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p
                    className="font-semibold"
                    style={{ color: form.primary_color }}
                  >
                    {form.business_name || "Business Name"}
                  </p>
                  <p className="text-sm" style={{ color: form.text_color }}>
                    Sample text preview
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Template Step 4: Design */}
        {!isCustom && step === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Design customization
            </h2>

            {/* Preset Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-3">Preset</label>
              <div className="grid grid-cols-5 gap-3">
                {DESIGN_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-colors ${
                      form.design.preset === p.id
                        ? "border-blue-600 bg-gray-100"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="w-full h-1 rounded-full mb-3" style={{ backgroundColor: p.accent }} />
                    <span className="text-sm font-medium text-gray-900">{p.label}</span>
                    <span className="text-xs text-gray-500 mt-1">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Card Style */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-3">Card Style</label>
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
                      form.design.cardStyle === s.id
                        ? "border-blue-600 bg-gray-100"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className={`w-16 h-10 ${s.preview} ${s.id === "flat" ? "bg-gray-300" : "bg-gray-300 border border-gray-300"}`} />
                    <span className="text-sm text-gray-900">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Button Shape */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-3">Button Shape</label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">Square</span>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={form.design.buttonRadius > 24 ? 24 : form.design.buttonRadius}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    updateDesign("buttonRadius", v === 24 ? 999 : v);
                  }}
                  className="flex-1 accent-blue-600"
                />
                <span className="text-xs text-gray-500">Pill</span>
              </div>
              <div className="mt-3 flex justify-center">
                <div
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium"
                  style={{ borderRadius: Math.min(form.design.buttonRadius, 24) }}
                >
                  Preview Button
                </div>
              </div>
            </div>

            {/* Card Layout */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-3">Card Layout</label>
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
                      form.design.cardColumns === opt.cols
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    {opt.icon}
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Template Step 5: Review */}
        {!isCustom && step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Review & Create
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-500">Template</span>
                <span className="text-sm text-gray-900 capitalize">
                  {form.template_type}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-500">Tenant ID</span>
                <span className="text-sm text-gray-900 font-mono">
                  {form.tenant_id}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-500">Business Name</span>
                <span className="text-sm text-gray-900">{form.business_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-500">Brand Colors</span>
                <div className="flex gap-2">
                  <div
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: form.primary_color }}
                    title={`Primary: ${form.primary_color}`}
                  />
                  <div
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: form.background_color }}
                    title={`Background: ${form.background_color}`}
                  />
                  <div
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: form.text_color }}
                    title={`Text: ${form.text_color}`}
                  />
                </div>
              </div>
              {form.logo_url && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-500">Logo</span>
                  <span className="text-sm text-gray-900 truncate max-w-xs">
                    {form.logo_url}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-sm text-gray-500">Design Preset</span>
                <span className="text-sm text-gray-900 capitalize">
                  {form.design.preset}
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            {successPrUrl && (
              <div className="rounded-lg bg-emerald-50 border border-green-200 px-3 py-2 text-sm text-emerald-700">
                Tenant created! PR opened:{" "}
                <a
                  href={successPrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium text-emerald-600 hover:text-emerald-500"
                >
                  {successPrUrl}
                </a>
                <span className="block text-xs text-emerald-600 mt-1">
                  Redirecting...
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Creating app..." : "Create App"}
          </button>
        )}
      </div>
    </div>
  );
}
