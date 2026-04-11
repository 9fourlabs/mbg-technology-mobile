"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

/** Wraps authenticated pages with the Preline sidebar layout. Hides sidebar on /login and /share. */
export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const isSharePage = pathname.startsWith("/share");

  if (isLoginPage || isSharePage) {
    return <>{children}</>;
  }

  return (
    <>
      {/* ── Mobile header with hamburger ── */}
      <div className="sticky top-0 inset-x-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 lg:hidden">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm">
              M
            </div>
            <span className="text-sm font-semibold text-gray-900">MBG Admin</span>
          </div>
          <button
            type="button"
            className="size-8 flex justify-center items-center gap-x-2 border border-gray-200 text-gray-800 hover:text-gray-500 rounded-lg focus:outline-none focus:text-gray-500"
            aria-haspopup="dialog"
            aria-expanded="false"
            aria-controls="hs-admin-sidebar"
            aria-label="Toggle navigation"
            data-hs-overlay="#hs-admin-sidebar"
          >
            <svg className="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" x2="21" y1="6" y2="6" />
              <line x1="3" x2="21" y1="12" y2="12" />
              <line x1="3" x2="21" y1="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <Sidebar />

      {/* ── Main content ── */}
      <div className="w-full lg:ps-64">
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </>
  );
}
