"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

/** Wraps authenticated pages with the sidebar. Hides sidebar on /login. */
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
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
