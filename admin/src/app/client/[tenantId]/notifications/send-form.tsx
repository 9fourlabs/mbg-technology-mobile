"use client";

import { useState } from "react";

export default function SendNotificationForm({ tenantId }: { tenantId: string }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<
    | { kind: "ok"; sent: number; failed: number }
    | { kind: "error"; message: string }
    | null
  >(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/notifications/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ kind: "error", message: data.error ?? "Unknown error" });
      } else {
        setResult({ kind: "ok", sent: data.sent ?? 0, failed: data.failed ?? 0 });
        setTitle("");
        setBody("");
      }
    } catch (err) {
      setResult({
        kind: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-white border border-gray-200 p-6 space-y-4 max-w-2xl"
    >
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
          Title
        </label>
        <input
          id="title"
          type="text"
          required
          maxLength={65}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="py-2.5 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-emerald-500"
          placeholder="New event this Friday"
        />
        <p className="text-xs text-gray-400 mt-1">{title.length}/65</p>
      </div>

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1.5">
          Message
        </label>
        <textarea
          id="body"
          required
          rows={3}
          maxLength={240}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="py-2.5 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-emerald-500 resize-y"
          placeholder="Doors open at 6 PM. RSVP via the Events tab."
        />
        <p className="text-xs text-gray-400 mt-1">{body.length}/240</p>
      </div>

      {result?.kind === "ok" && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          Sent to {result.sent} {result.sent === 1 ? "device" : "devices"}.
          {result.failed > 0 && (
            <> ({result.failed} failed — likely uninstalled apps.)</>
          )}
        </div>
      )}
      {result?.kind === "error" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {result.message}
        </div>
      )}

      <button
        type="submit"
        disabled={sending || !title || !body}
        className="px-5 py-2.5 inline-flex items-center gap-2 text-sm font-medium rounded-lg border border-transparent bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none"
      >
        {sending ? "Sending…" : "Send notification"}
      </button>
    </form>
  );
}
