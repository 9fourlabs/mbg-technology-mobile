const SUPABASE_API = "https://api.supabase.com/v1";

function getAccessToken(): string {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("SUPABASE_ACCESS_TOKEN environment variable is not set");
  }
  return token;
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${getAccessToken()}`,
    "Content-Type": "application/json",
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Supabase Management API error (${res.status}): ${body}`,
    );
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Create a new Supabase project in the given organization.
 */
export async function createProject(
  name: string,
  orgId: string,
  region = "us-east-1",
): Promise<{ ref: string }> {
  const dbPass = crypto.randomUUID() + crypto.randomUUID();

  const data = await handleResponse<{ id: string }>(
    await fetch(`${SUPABASE_API}/projects`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        name,
        organization_id: orgId,
        region,
        plan: "free",
        db_pass: dbPass,
      }),
    }),
  );
  return { ref: data.id };
}

/**
 * Get the current status of a project.
 */
export async function getProjectStatus(
  ref: string,
): Promise<{ status: string }> {
  const data = await handleResponse<{ status: string }>(
    await fetch(`${SUPABASE_API}/projects/${ref}`, {
      method: "GET",
      headers: headers(),
    }),
  );
  return { status: data.status };
}

/**
 * Retrieve the anon and service_role API keys for a project.
 */
export async function getProjectApiKeys(
  ref: string,
): Promise<{ anonKey: string; serviceRoleKey: string }> {
  const keys = await handleResponse<{ name: string; api_key: string }[]>(
    await fetch(`${SUPABASE_API}/projects/${ref}/api-keys`, {
      method: "GET",
      headers: headers(),
    }),
  );

  const anon = keys.find((k) => k.name === "anon");
  const serviceRole = keys.find((k) => k.name === "service_role");

  if (!anon || !serviceRole) {
    throw new Error(`Could not find API keys for project ${ref}`);
  }

  return {
    anonKey: anon.api_key,
    serviceRoleKey: serviceRole.api_key,
  };
}

/**
 * Run arbitrary SQL against a project's database.
 */
export async function runSQL(ref: string, sql: string): Promise<void> {
  await handleResponse<unknown>(
    await fetch(`${SUPABASE_API}/projects/${ref}/database/query`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ query: sql }),
    }),
  );
}

/**
 * Derive the public Supabase URL for a project ref.
 */
export function getProjectUrl(ref: string): string {
  return `https://${ref}.supabase.co`;
}
