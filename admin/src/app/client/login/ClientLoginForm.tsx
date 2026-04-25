"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction, type LoginState } from "@/app/login/actions";

const initialState: LoginState = { error: null };

export function ClientLoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/client";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="py-2.5 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-50 disabled:pointer-events-none"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="py-2.5 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-emerald-500 disabled:opacity-50 disabled:pointer-events-none"
          placeholder="Your password"
        />
      </div>

      {state.error && (
        <div
          className="bg-red-100 border border-red-200 text-sm text-red-800 rounded-lg p-4 flex items-center gap-x-3"
          role="alert"
        >
          <span>{state.error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none"
      >
        {pending ? "Signing in..." : "Sign In"}
      </button>

      <p className="text-xs text-gray-500 text-center pt-2">
        Don&apos;t have an account? Contact your MBG account manager.
      </p>
    </form>
  );
}
