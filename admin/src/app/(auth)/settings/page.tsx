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
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Platform configuration and team management
        </p>
      </div>

      {/* Platform Info */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-6 mb-6">
        <h2 className="text-base font-semibold text-white mb-4">
          Platform Info
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-800">
            <span className="text-sm text-gray-400">GitHub Repository</span>
            <span className="text-sm text-white font-mono">
              mbg-technology-mobile
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-800">
            <span className="text-sm text-gray-400">Expo Project</span>
            <span className="text-sm text-white font-mono">
              mbg-technology-mobile
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-400">Admin Version</span>
            <span className="text-sm text-white">0.1.0</span>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 mb-6">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">Team Members</h2>
        </div>
        {profiles && profiles.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {profiles.map((profile) => (
                <tr key={profile.id} className="text-sm">
                  <td className="px-6 py-3 text-white">
                    {profile.full_name ?? "---"}
                  </td>
                  <td className="px-6 py-3 text-gray-400">{profile.email}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-400">
                      {profile.role ?? "member"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            No team members found. Profiles are created when users sign in.
          </div>
        )}
      </div>

      {/* Environment Variables */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
        <h2 className="text-base font-semibold text-white mb-4">
          Environment Variables
        </h2>
        <div className="space-y-2">
          {envVars.map((env) => (
            <div
              key={env.name}
              className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
            >
              <span className="text-sm text-gray-300 font-mono">
                {env.name}
              </span>
              {env.set ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-400">
                  configured
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-400">
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
