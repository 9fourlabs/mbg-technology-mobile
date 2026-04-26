"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ClientLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/client";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="py-2.5 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-50 disabled:pointer-events-none"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="py-2.5 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-50 disabled:pointer-events-none"
          placeholder="Your password"
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-200 text-sm text-red-800 rounded-lg p-4 flex items-center gap-x-3" role="alert">
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>

      <p className="text-xs text-gray-500 text-center pt-2">
        Don&apos;t have an account? Contact your MBG account manager.
      </p>
    </form>
  );
}

export default function ClientLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 text-white font-bold text-xl mb-4">
            C
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Client Portal</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to manage your app
          </p>
        </div>

        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <Suspense fallback={<div className="h-64" />}>
            <ClientLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
