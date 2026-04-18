import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getUserContext } from "@/lib/auth/user-context";

export default async function ClientLayout({ children }: { children: ReactNode }) {
  // Skip layout chrome on the login page itself.
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (pathname.startsWith("/client/login")) {
    return <>{children}</>;
  }

  const ctx = await getUserContext();
  if (!ctx) redirect("/client/login");

  // Admins can browse the client portal but get a banner reminding them they're
  // viewing it as MBG staff.
  const isAdmin = ctx.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/client" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-sm">
              C
            </div>
            <span className="font-semibold text-sm">Client Portal</span>
          </Link>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{ctx.user.email}</span>
            {isAdmin && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                MBG admin view
              </span>
            )}
            <form action="/api/auth/sign-out" method="POST">
              <button type="submit" className="text-gray-600 hover:text-gray-900 underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
