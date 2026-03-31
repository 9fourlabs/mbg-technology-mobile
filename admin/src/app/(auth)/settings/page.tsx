import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();

  // Fetch team members
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: true });

  // Check env status
  const envVars = [
    {
      name: "NEXT_PUBLIC_SUPABASE_URL",
      set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    {
      name: "SUPABASE_SERVICE_ROLE_KEY",
      set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    { name: "EXPO_TOKEN", set: !!process.env.EXPO_TOKEN },
    { name: "GITHUB_TOKEN", set: !!process.env.GITHUB_TOKEN },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Platform configuration and team management
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
            <span className="text-sm text-gray-500">Expo Project</span>
            <span className="text-sm text-gray-900 font-mono">
              mbg-technology-mobile
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-500">Admin Version</span>
            <span className="text-sm text-gray-900">0.1.0</span>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="rounded-xl bg-white border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Team Members</h2>
        </div>
        {profiles && profiles.length > 0 ? (
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
              {profiles.map((profile) => (
                <tr key={profile.id} className="text-sm">
                  <td className="px-6 py-3 text-gray-900">
                    {profile.full_name ?? "---"}
                  </td>
                  <td className="px-6 py-3 text-gray-500">{profile.email}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                      {profile.role ?? "member"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-400">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-8 text-center text-sm text-gray-400">
            No team members found. Profiles are created when users sign in.
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
              <span className="text-sm text-gray-600 font-mono">
                {env.name}
              </span>
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
