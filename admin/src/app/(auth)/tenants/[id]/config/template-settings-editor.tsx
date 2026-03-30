"use client";

interface TemplateSettingsEditorProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}

export default function TemplateSettingsEditor({ config, onChange }: TemplateSettingsEditorProps) {
  const templateId = (config?.templateId as string) ?? "informational";
  const tabs = (config?.tabs ?? []) as Array<{ id: string; label: string }>;

  function updateNested(key: string, field: string, value: unknown) {
    const current = (config?.[key] ?? {}) as Record<string, unknown>;
    onChange({ ...config, [key]: { ...current, [field]: value } });
  }

  if (templateId === "informational") {
    return (
      <div>
        <h2 className="text-base font-semibold text-white mb-1">Template Settings</h2>
        <p className="text-sm text-gray-400 mb-4">
          The informational template has no additional settings beyond brand, design, and tabs.
        </p>
        <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-4 text-center">
          <p className="text-sm text-gray-500">No additional settings required.</p>
        </div>
      </div>
    );
  }

  const auth = (config?.auth ?? {}) as Record<string, string>;

  return (
    <div>
      <h2 className="text-base font-semibold text-white mb-1">Template Settings</h2>
      <p className="text-sm text-gray-400 mb-4">
        Settings specific to the <span className="text-white font-medium">{templateId}</span> template.
      </p>

      {/* Auth settings (all non-informational templates) */}
      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-semibold text-white">Authentication</h3>
        <TextInput
          label="Supabase URL"
          value={auth.supabaseUrl ?? ""}
          onChange={(v) => updateNested("auth", "supabaseUrl", v)}
          placeholder="https://xxxxx.supabase.co"
          mono
        />
        <TextInput
          label="Supabase Anon Key"
          value={auth.supabaseAnonKey ?? ""}
          onChange={(v) => updateNested("auth", "supabaseAnonKey", v)}
          placeholder="eyJ..."
          mono
        />

        {/* Protected tabs picker */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">Protected Tabs (require login)</label>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const protectedTabs = (config?.protectedTabs ?? []) as string[];
              const isProtected = protectedTabs.includes(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    const current = (config?.protectedTabs ?? []) as string[];
                    const updated = isProtected
                      ? current.filter((t) => t !== tab.id)
                      : [...current, tab.id];
                    onChange({ ...config, protectedTabs: updated });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isProtected
                      ? "bg-[#2563EB] text-white"
                      : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Template-specific settings */}
      {templateId === "booking" && (
        <BookingSettings config={config} onChange={onChange} />
      )}
      {templateId === "commerce" && (
        <CommerceSettings config={config} onChange={onChange} />
      )}

      {/* Fallback for other templates */}
      {!["informational", "authenticated", "booking", "commerce"].includes(templateId) && (
        <div className="rounded-lg bg-yellow-900/20 border border-yellow-800/50 p-3 mt-4">
          <p className="text-xs text-yellow-400">
            Additional {templateId} settings can be configured in the Raw JSON tab.
          </p>
        </div>
      )}
    </div>
  );
}

function BookingSettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const booking = (config?.booking ?? {}) as Record<string, unknown>;

  function update(field: string, value: unknown) {
    onChange({ ...config, booking: { ...booking, [field]: value } });
  }

  return (
    <div className="space-y-4 border-t border-gray-800 pt-4">
      <h3 className="text-sm font-semibold text-white">Booking Settings</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Slot Duration (min)</label>
          <input
            type="number"
            value={(booking.slotDuration as number) ?? 30}
            onChange={(e) => update("slotDuration", Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Advance Booking (days)</label>
          <input
            type="number"
            value={(booking.advanceBookingDays as number) ?? 30}
            onChange={(e) => update("advanceBookingDays", Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>
      </div>
      <TextInput
        label="Cancellation Policy"
        value={(booking.cancellationPolicy as string) ?? ""}
        onChange={(v) => update("cancellationPolicy", v)}
        placeholder="Free cancellation up to 24h before..."
      />
    </div>
  );
}

function CommerceSettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const commerce = (config?.commerce ?? {}) as Record<string, unknown>;

  function update(field: string, value: unknown) {
    onChange({ ...config, commerce: { ...commerce, [field]: value } });
  }

  return (
    <div className="space-y-4 border-t border-gray-800 pt-4">
      <h3 className="text-sm font-semibold text-white">Commerce Settings</h3>
      <TextInput
        label="Store Name"
        value={(commerce.storeName as string) ?? ""}
        onChange={(v) => update("storeName", v)}
        placeholder="My Store"
      />
      <TextInput
        label="Stripe Publishable Key"
        value={(commerce.stripePublishableKey as string) ?? ""}
        onChange={(v) => update("stripePublishableKey", v)}
        placeholder="pk_..."
        mono
      />
      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Currency"
          value={(commerce.currency as string) ?? "USD"}
          onChange={(v) => update("currency", v)}
          placeholder="USD"
        />
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tax Rate (%)</label>
          <input
            type="number"
            step="0.01"
            value={(commerce.taxRate as number) ?? 0}
            onChange={(e) => update("taxRate", Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>
      </div>
    </div>
  );
}
