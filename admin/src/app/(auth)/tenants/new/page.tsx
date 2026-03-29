"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TEMPLATE_TYPES = [
  { id: "restaurant", label: "Restaurant", emoji: "\u{1F354}", color: "border-orange-500" },
  { id: "church", label: "Church", emoji: "\u{26EA}", color: "border-purple-500" },
  { id: "barber", label: "Barber", emoji: "\u2702\uFE0F", color: "border-blue-500" },
  { id: "beauty", label: "Beauty", emoji: "\u{1F484}", color: "border-pink-500" },
  { id: "fitness", label: "Fitness", emoji: "\u{1F3CB}\uFE0F", color: "border-green-500" },
  { id: "realestate", label: "Real Estate", emoji: "\u{1F3E0}", color: "border-teal-500" },
  { id: "nonprofit", label: "Nonprofit", emoji: "\u{1F91D}", color: "border-indigo-500" },
  { id: "retail", label: "Retail", emoji: "\u{1F6CD}\uFE0F", color: "border-yellow-500" },
];

const STEPS = ["Template", "Identity", "Brand", "Review"];

interface FormData {
  template_type: string;
  tenant_id: string;
  business_name: string;
  primary_color: string;
  background_color: string;
  text_color: string;
  logo_url: string;
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
        return true;
      default:
        return false;
    }
  };

  const validateTenantId = (id: string) => {
    return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(id) && id.length >= 3;
  };

  const handleCreate = async () => {
    setError(null);
    setCreating(true);

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("tenants").insert({
        id: form.tenant_id,
        template_type: form.template_type,
        business_name: form.business_name,
        status: "draft",
        config: {
          brand: {
            primaryColor: form.primary_color,
            backgroundColor: form.background_color,
            textColor: form.text_color,
            logoUrl: form.logo_url,
          },
        },
      });

      if (insertError) {
        setError(insertError.message);
        setCreating(false);
        return;
      }

      router.push(`/tenants/${form.tenant_id}`);
    } catch (err) {
      setError("Failed to create tenant. Please try again.");
      setCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">New Tenant</h1>
        <p className="text-sm text-gray-400 mt-1">
          Set up a new tenant configuration in {STEPS.length} steps
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
            <h2 className="text-lg font-semibold text-white mb-4">
              Choose a template
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {TEMPLATE_TYPES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => updateForm({ template_type: template.id })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                    form.template_type === template.id
                      ? `${template.color} bg-gray-800`
                      : "border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <span className="text-3xl">{template.emoji}</span>
                  <span className="text-sm font-medium text-white">
                    {template.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Identity */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">
              Tenant identity
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Tenant ID
              </label>
              <input
                type="text"
                value={form.tenant_id}
                onChange={(e) =>
                  updateForm({
                    tenant_id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  })
                }
                placeholder="my-business-name"
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lowercase letters, numbers, and hyphens only. Min 3 characters.
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
            <h2 className="text-lg font-semibold text-white mb-4">
              Brand basics
            </h2>
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
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Logo URL (optional)
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

        {/* Step 4: Review */}
        {step === 3 && (
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
            </div>

            {error && (
              <div className="rounded-lg bg-red-900/30 border border-red-800 px-3 py-2 text-sm text-red-400">
                {error}
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
            {creating ? "Creating..." : "Create Tenant"}
          </button>
        )}
      </div>
    </div>
  );
}
