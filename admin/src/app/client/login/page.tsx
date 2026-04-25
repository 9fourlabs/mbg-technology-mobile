import { Suspense } from "react";
import { ClientLoginForm } from "./ClientLoginForm";

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
