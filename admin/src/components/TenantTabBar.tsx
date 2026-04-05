"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface TenantTabBarProps {
  tenantId: string;
  tenantName: string;
  appType?: string;
}

const TABS = [
  { label: "Overview", path: "" },
  { label: "Design", path: "/config" },
  { label: "Content", path: "/content" },
  { label: "Assets", path: "/assets" },
  { label: "Analytics", path: "/analytics" },
  { label: "Builds", path: "/builds" },
];

export default function TenantTabBar({
  tenantId,
  tenantName,
  appType,
}: TenantTabBarProps) {
  const pathname = usePathname();
  const basePath = `/tenants/${tenantId}`;

  // Hide Content tab for custom apps (no content management)
  const visibleTabs = TABS.filter((tab) => {
    if (tab.path === "/content" && appType === "custom") return false;
    // Hide Design tab for custom apps (they edit code directly)
    if (tab.path === "/config" && appType === "custom") return false;
    // Hide Assets tab for custom apps
    if (tab.path === "/assets" && appType === "custom") return false;
    return true;
  });

  function isActive(tabPath: string) {
    const fullPath = basePath + tabPath;
    if (tabPath === "") {
      // Overview tab is active when exactly on /tenants/[id]
      return pathname === basePath || pathname === basePath + "/";
    }
    return pathname.startsWith(fullPath);
  }

  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/tenants" className="hover:text-gray-900 transition-colors">
          Apps
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{tenantName}</span>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px">
          {visibleTabs.map((tab) => (
            <Link
              key={tab.path}
              href={basePath + tab.path}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                isActive(tab.path)
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
