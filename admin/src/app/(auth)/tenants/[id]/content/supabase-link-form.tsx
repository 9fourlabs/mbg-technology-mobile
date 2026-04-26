"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SupabaseLinkForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!url.trim()) {
      setError("Supabase URL is required");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("tenants")
        .update({
          supabase_url: url.trim(),
          supabase_anon_key: anonKey.trim() || null,
          supabase_project_id: url.trim(), // Use URL as project identifier
        })
        .eq("id", tenantId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.refresh();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-6 max-w-lg">
      <h2 className="text-base font-semibold text-gray-900 mb-1">
        Link Supabase Project
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Connect a Supabase project to manage content for this app. Get these
        values from your{" "}
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Supabase dashboard
        </a>{" "}
        → Project Settings → API.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Supabase URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="py-2.5 px-4 block w-full border-gray-200 rounded-lg text-sm font-mono focus:border-blue-500 focus:ring-blue-500"
            placeholder="https://xxxxx.supabase.co"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Supabase Anon Key
          </label>
          <input
            type="text"
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value)}
            className="py-2.5 px-4 block w-full border-gray-200 rounded-lg text-sm font-mono focus:border-blue-500 focus:ring-blue-500"
            placeholder="eyJ..."
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
        >
          {saving ? "Saving..." : "Link Project"}
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          Don&apos;t have a Supabase project?{" "}
          <a
            href="https://supabase.com/dashboard/new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Create one for free
          </a>
        </p>
      </div>
    </div>
  );
}
