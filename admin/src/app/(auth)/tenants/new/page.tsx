"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";

const TEMPLATE_TYPES = [
  { id: "informational", label: "Informational", emoji: "\u{1F4CB}", color: "border-gray-500", description: "A simple branded app with pages of content. Perfect for businesses that want a mobile presence." },
  { id: "authenticated", label: "Authenticated", emoji: "\u{1F512}", color: "border-blue-500", description: "Like Informational, but users can create accounts and log in. Good for membership organizations." },
  { id: "booking", label: "Booking", emoji: "\u{1F4C5}", color: "border-green-500", description: "Lets customers book appointments and manage their schedule. Ideal for salons, consultants, trainers." },
  { id: "commerce", label: "Commerce", emoji: "\u{1F6D2}", color: "border-yellow-500", description: "An online store with product catalog, shopping cart, and checkout. For retail, food, merchandise." },
  { id: "loyalty", label: "Loyalty", emoji: "\u{2B50}", color: "border-purple-500", description: "A digital loyalty card with points, rewards, and tier progression. Great for coffee shops, restaurants." },
  { id: "content", label: "Content", emoji: "\u{1F4F0}", color: "border-orange-500", description: "A content feed with articles, categories, and bookmarks. For newsletters, blogs, training content." },
  { id: "forms", label: "Forms", emoji: "\u{1F4DD}", color: "border-teal-500", description: "Custom forms for collecting information from users. Insurance intake, surveys, applications." },
  { id: "directory", label: "Directory", emoji: "\u{1F4D6}", color: "border-indigo-500", description: "A searchable directory with categories and detail pages. Member directories, location finders." },
];

const STEPS = ["Template", "Identity", "Brand", "Design", "Review"];

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

interface FormData {
  template_type: string;
  tenant_id: string;
  business_name: string;
  primary_color: string;
  background_color: string;
  text_color: string;
  logo_url: string;
  design: DesignData;
}

export default function NewTenantPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormData>({
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
  });

  const updateForm = (updates: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return form.template_type !== "";
      case 1:
        return form.tenant_id.length >= 3 && form.business_name.length >= 1;
      case 2:
        return form.primary_color !== "";
      case 3:
        return form.design.preset !== "";
      case 4:
        return true;
      default:
        return false;
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
      const res = await fetch("/api/tenants/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: form.tenant_id,
          template_type: form.template_type,
          business_name: form.business_name,
          brand: {
            primaryColor: form.primary_color,
            backgroundColor: form.background_color,
            textColor: form.text_color,
            logoUrl: form.logo_url,
          },
          design: form.design,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create tenant.");
        setCreating(false);
        return;
      }

      // Show success banner with PR link, then redirect after a short delay
      setSuccessPrUrl(data.pr_url);
      setTimeout(() => {
        router.push(`/tenants/${form.tenant_id}`);
      }, 3000);
    } catch (err) {
      setError("Failed to create tenant. Please try again.");
      setCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Create a New Client App</h1>
        <p className="text-sm text-gray-400 mt-1">
          Set up a branded mobile app for your client in {STEPS.length} easy steps. No coding needed.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                i === step
                  ? "bg-[#2563EB] text-white"
                  : i < step
                    ? "bg-green-600 text-white"
                    : "bg-gray-800 text-gray-500"
              }`}
            >
              {i < step ? "\u2713" : i + 1}
            </div>
            <span
              className={`text-sm hidden sm:block ${
                i === step ? "text-white font-medium" : "text-gray-500"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px bg-gray-800 mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
        {/* Step 1: Template */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">
              Choose a template
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Each template is a different type of app. Pick the one that best matches what your client needs.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATE_TYPES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => updateForm({ template_type: template.id })}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                    form.template_type === template.id
                      ? `${template.color} bg-gray-800`
                      : "border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <span className="text-2xl mt-0.5">{template.emoji}</span>
                  <div>
                    <span className="text-sm font-medium text-white block">
                      {template.label}
                    </span>
                    <span className="text-xs text-gray-400 mt-1 block leading-relaxed">
                      {template.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Identity */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-1">
              Client details
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Tell us about your client. This information is used to set up their app.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                App ID
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
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                This is the internal identifier for this app. Use something like &quot;acme-dental&quot; or &quot;toms-burgers&quot;. Lowercase, hyphens only. Min 3 characters.
              </p>
              {form.tenant_id.length > 0 && !validateTenantId(form.tenant_id) && (
                <p className="text-xs text-red-400 mt-1">
                  Invalid tenant ID format.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Business Name
              </label>
              <input
                type="text"
                value={form.business_name}
                onChange={(e) => updateForm({ business_name: e.target.value })}
                placeholder="My Business"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Step 3: Brand */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-1">
              Brand basics
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              These colors define how your client&apos;s app looks. The primary color is used for buttons and highlights. Background and text colors set the overall theme.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) =>
                      updateForm({ primary_color: e.target.value })
                    }
                    className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={form.primary_color}
                    onChange={(e) =>
                      updateForm({ primary_color: e.target.value })
                    }
                    className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.background_color}
                    onChange={(e) =>
                      updateForm({ background_color: e.target.value })
                    }
                    className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={form.background_color}
                    onChange={(e) =>
                      updateForm({ background_color: e.target.value })
                    }
                    className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Text Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.text_color}
                    onChange={(e) =>
                      updateForm({ text_color: e.target.value })
                    }
                    className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={form.text_color}
                    onChange={(e) =>
                      updateForm({ text_color: e.target.value })
                    }
                    className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Or enter URL directly
              </label>
              <input
                type="url"
                value={form.logo_url}
                onChange={(e) => updateForm({ logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
            </div>
            {/* Preview */}
            <div className="mt-4 p-4 rounded-lg border border-gray-700">
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

        {/* Step 4: Design */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Design customization
            </h2>

            {/* Preset Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Preset</label>
              <div className="grid grid-cols-5 gap-3">
                {DESIGN_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-colors ${
                      form.design.preset === p.id
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
                      form.design.cardStyle === s.id
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
                  value={form.design.buttonRadius > 24 ? 24 : form.design.buttonRadius}
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
                  style={{ borderRadius: Math.min(form.design.buttonRadius, 24) }}
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
                      form.design.cardColumns === opt.cols
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
          </div>
        )}

        {/* Step 5: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">
              Review & Create
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-sm text-gray-400">Template</span>
                <span className="text-sm text-white capitalize">
                  {form.template_type}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-sm text-gray-400">Tenant ID</span>
                <span className="text-sm text-white font-mono">
                  {form.tenant_id}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-sm text-gray-400">Business Name</span>
                <span className="text-sm text-white">{form.business_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-sm text-gray-400">Brand Colors</span>
                <div className="flex gap-2">
                  <div
                    className="w-6 h-6 rounded border border-gray-700"
                    style={{ backgroundColor: form.primary_color }}
                    title={`Primary: ${form.primary_color}`}
                  />
                  <div
                    className="w-6 h-6 rounded border border-gray-700"
                    style={{ backgroundColor: form.background_color }}
                    title={`Background: ${form.background_color}`}
                  />
                  <div
                    className="w-6 h-6 rounded border border-gray-700"
                    style={{ backgroundColor: form.text_color }}
                    title={`Text: ${form.text_color}`}
                  />
                </div>
              </div>
              {form.logo_url && (
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-sm text-gray-400">Logo</span>
                  <span className="text-sm text-white truncate max-w-xs">
                    {form.logo_url}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-sm text-gray-400">Design Preset</span>
                <span className="text-sm text-white capitalize">
                  {form.design.preset}
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-900/30 border border-red-800 px-3 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            {successPrUrl && (
              <div className="rounded-lg bg-green-900/30 border border-green-800 px-3 py-2 text-sm text-green-400">
                Tenant created! PR opened:{" "}
                <a
                  href={successPrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium text-green-300 hover:text-green-200"
                >
                  {successPrUrl}
                </a>
                <span className="block text-xs text-green-500 mt-1">
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
          className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="px-6 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-6 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Creating tenant & opening PR..." : "Create Tenant"}
          </button>
        )}
      </div>
    </div>
  );
}
