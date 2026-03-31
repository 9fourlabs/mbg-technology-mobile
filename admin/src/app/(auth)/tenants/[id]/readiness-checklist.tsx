import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface CheckItem {
  label: string;
  passed: boolean;
  href?: string;
  hint?: string;
}

export default async function ReadinessChecklist({
  tenantId,
}: {
  tenantId: string;
}) {
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, config, expo_project_id, supabase_project_id, template_type, app_type, repo_url")
    .eq("id", tenantId)
    .single();

  if (!tenant) return null;

  const config = tenant.config as Record<string, unknown> | null;
  const brand = (config?.brand ?? {}) as Record<string, string>;
  const tabs = (config?.tabs ?? []) as unknown[];

  // Check for at least one successful preview build
  const { count: successfulBuilds } = await supabase
    .from("builds")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("profile", "preview")
    .eq("status", "completed");

  const isCustom = (tenant as Record<string, unknown>).app_type === "custom";

  const needsContent = !isCustom && [
    "booking",
    "commerce",
    "content",
    "directory",
    "loyalty",
  ].includes(tenant.template_type);

  const checks: CheckItem[] = isCustom
    ? [
        {
          label: "Repo URL configured",
          passed: !!(tenant as Record<string, unknown>).repo_url,
          hint: "Custom apps need a GitHub repo URL",
        },
        {
          label: "App ID configured",
          passed: !!tenant.expo_project_id,
          hint: "Required for production builds and app store submission",
        },
        {
          label: "Preview build complete",
          passed: (successfulBuilds ?? 0) > 0,
          href: `/tenants/${tenantId}/builds`,
          hint: "Deploy at least one successful preview build before going to production",
        },
      ]
    : [
        {
          label: "Settings saved",
          passed: !!config && tabs.length > 0,
          href: `/tenants/${tenantId}/config`,
          hint: "Save at least one tab in the config editor",
        },
        {
          label: "Brand colors set",
          passed: !!brand.primaryColor,
          href: `/tenants/${tenantId}/config`,
          hint: "Set a primary color and optionally a logo",
        },
        {
          label: "App ID configured",
          passed: !!tenant.expo_project_id,
          href: `/tenants/${tenantId}/config`,
          hint: "Required for production builds and app store submission",
        },
        {
          label: "Preview build complete",
          passed: (successfulBuilds ?? 0) > 0,
          href: `/tenants/${tenantId}/builds`,
          hint: "Deploy at least one successful preview build before going to production",
        },
      ];

  if (needsContent) {
    checks.push({
      label: "Supabase project linked",
      passed: !!tenant.supabase_project_id,
      href: `/tenants/${tenantId}/config`,
      hint: "Content-based templates need a Supabase project for data",
    });
  }

  const passedCount = checks.filter((c) => c.passed).length;
  const allPassed = passedCount === checks.length;

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          Go-Live Checklist
        </h2>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            allPassed
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {passedCount}/{checks.length} checks passed
        </span>
      </div>

      <div className="space-y-3">
        {checks.map((check) => (
          <div key={check.label} className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0">
              {check.passed ? (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 text-xs">
                  ✓
                </span>
              ) : (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-50 text-red-600 text-xs">
                  ✗
                </span>
              )}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm ${check.passed ? "text-gray-600" : "text-gray-900 font-medium"}`}
                >
                  {check.label}
                </span>
                {!check.passed && check.href && (
                  <Link
                    href={check.href}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Fix
                  </Link>
                )}
              </div>
              {!check.passed && check.hint && (
                <p className="text-xs text-gray-500 mt-0.5">{check.hint}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
