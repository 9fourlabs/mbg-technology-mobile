import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-xl mb-4">
            M
          </div>
          <h1 className="text-xl font-semibold text-gray-900">MBG Admin</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to manage your mobile platform
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
          <Suspense fallback={<div className="h-64" />}>
            <LoginForm defaultRedirect="/" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
