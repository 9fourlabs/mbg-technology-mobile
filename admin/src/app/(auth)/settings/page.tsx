import { adminPb } from "@/lib/pocketbase/admin-client";

interface MbgUser {
  id: string;
  email: string;
  name?: string;
  is_mbg_admin: boolean;
  created: string;
}

export default async function SettingsPage() {
  // Team members = MBG-admin users in the PB users collection.
  const pb = await adminPb();
  let users: MbgUser[] = [];
  try {
    const result = await pb.list<MbgUser>("users", {
      filter: "is_mbg_admin = true",
      sort: "+created",
      perPage: 100,
    });
    users = result.items;
  } catch {
    // Empty list on failure — non-fatal for the settings UI.
  }

  const envVars = [
    { name: "POCKETBASE_ADMIN_URL", set: !!process.env.POCKETBASE_ADMIN_URL },
    { name: "PB_ADMIN_PASSWORD", set: !!process.env.PB_ADMIN_PASSWORD },
    { name: "EXPO_TOKEN", set: !!process.env.EXPO_TOKEN },
    { name: "GITHUB_TOKEN", set: !!process.env.GITHUB_TOKEN },
    {
      name: "ADMIN_BUILD_LINK_SECRET",
      set: !!process.env.ADMIN_BUILD_LINK_SECRET,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Platform configuration and team management. Per-app settings live
          in each app&apos;s Design tab.
        </p>
      </div>

      {/* Platform Info */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Platform Info
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm text-gray-500">GitHub Repository</span>
            <span className="text-sm text-gray-900 font-mono">
              mbg-technology-mobile
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm text-gray-500">Admin Backend</span>
            <span className="text-sm text-gray-900 font-mono">
              Pocketbase ({process.env.POCKETBASE_ADMIN_URL ?? "(not set)"})
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-500">Admin Version</span>
            <span className="text-sm text-gray-900">0.2.0</span>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="rounded-xl bg-white border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            MBG Admin Team
          </h2>
        </div>
        {users.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-200">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id} className="text-sm">
                  <td className="px-6 py-3 text-gray-900">
                    {u.name ?? "—"}
                  </td>
                  <td className="px-6 py-3 text-gray-500">{u.email}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                      admin
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-400">
                    {new Date(u.created).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-8 text-center text-sm text-gray-400">
            No admin users found.
          </div>
        )}
      </div>

      {/* Environment Variables */}
      <div className="rounded-xl bg-white border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Environment Variables
        </h2>
        <div className="space-y-2">
          {envVars.map((env) => (
            <div
              key={env.name}
              className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
            >
              <span className="text-sm text-gray-600 font-mono">{env.name}</span>
              {env.set ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                  configured
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                  missing
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
