/**
 * EAS (Expo Application Services) API wrapper.
 *
 * For MVP these are stubs that define the interface. The actual EAS REST API
 * integration can be wired up later once the build pipeline is finalized.
 */

const EAS_API = "https://api.expo.dev";

function getToken(): string {
  const token = process.env.EXPO_TOKEN;
  if (!token) throw new Error("EXPO_TOKEN environment variable is not set");
  return token;
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorkflowRunResult = {
  id: string;
  status: string;
  url: string;
};

export type BuildStatus = {
  id: string;
  status: "in-queue" | "in-progress" | "finished" | "errored" | "canceled";
  platform: string | null;
  downloadUrl: string | null;
  error: string | null;
};

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Trigger an EAS workflow for the given project.
 *
 * @param projectId - The Expo project ID (UUID)
 * @param workflowFile - The workflow filename (e.g. "build-preview.yml")
 * @param inputs - Key-value inputs passed to the workflow
 */
export async function triggerWorkflow(
  projectId: string,
  workflowFile: string,
  inputs: Record<string, string> = {}
): Promise<WorkflowRunResult> {
  const res = await fetch(
    `${EAS_API}/v2/projects/${projectId}/workflow-runs`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        workflowFile,
        inputs,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`EAS API error (${res.status}): ${body}`);
  }

  const data = await res.json();

  return {
    id: data.id ?? "unknown",
    status: data.status ?? "in-queue",
    url:
      data.url ??
      `https://expo.dev/accounts/mbg-technology/projects/${projectId}/workflow-runs`,
  };
}

/**
 * Get the status of an EAS build by its ID.
 *
 * @param buildId - The EAS build UUID
 */
// ---------------------------------------------------------------------------
// Expo URL helpers
// ---------------------------------------------------------------------------

const EXPO_ACCOUNT = "ninefour-labs";
const EXPO_PROJECT = "mbg-technology";

/** URL to the builds list on Expo dashboard. */
export function getExpoBuildPageUrl(): string {
  return `https://expo.dev/accounts/${EXPO_ACCOUNT}/projects/${EXPO_PROJECT}/builds`;
}

/** URL to a specific build's install / detail page on Expo. */
export function getExpoInstallUrl(buildId: string): string {
  return `https://expo.dev/accounts/${EXPO_ACCOUNT}/projects/${EXPO_PROJECT}/builds/${buildId}`;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Project builds list
// ---------------------------------------------------------------------------

const EXPO_PROJECT_ID = "8f0869f4-6354-4c29-956a-abf07a54c9b6";

export type EASBuild = {
  id: string;
  status: string;
  platform: string;
  downloadUrl: string | null;
  createdAt: string;
};

/**
 * List recent builds for the Expo project.
 */
export async function getEASBuilds(limit = 10): Promise<EASBuild[]> {
  const res = await fetch(
    `${EAS_API}/v2/projects/${EXPO_PROJECT_ID}/builds?limit=${limit}`,
    { method: "GET", headers: headers() }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`EAS API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  console.log("[EAS] Raw response keys:", Object.keys(data));

  // The Expo REST API may return builds under different keys
  let builds: unknown[];
  if (Array.isArray(data.data)) {
    builds = data.data;
  } else if (Array.isArray(data.builds)) {
    builds = data.builds;
  } else if (Array.isArray(data)) {
    builds = data;
  } else {
    console.warn("[EAS] Unexpected response structure:", JSON.stringify(data).slice(0, 500));
    return [];
  }

  return builds.map((b) => {
    const item = b as Record<string, unknown>;
    const artifacts = item.artifacts as Record<string, unknown> | undefined;
    // Expo uses different field names across API versions
    const downloadUrl =
      (artifacts?.buildUrl as string) ??
      (artifacts?.applicationArchiveUrl as string) ??
      null;
    return {
      id: (item.id as string) ?? "unknown",
      status: (item.status as string) ?? "unknown",
      platform: (item.platform as string) ?? "unknown",
      downloadUrl,
      createdAt: (item.createdAt as string) ?? new Date().toISOString(),
    };
  });
}

/**
 * Get a single EAS build by ID.
 */
export async function getEASBuildById(
  buildId: string
): Promise<EASBuild | null> {
  const res = await fetch(`${EAS_API}/v2/builds/${buildId}`, {
    method: "GET",
    headers: headers(),
  });

  if (!res.ok) return null;

  const b = await res.json();
  return {
    id: b.id ?? buildId,
    status: b.status ?? "unknown",
    platform: b.platform ?? "unknown",
    downloadUrl: b.artifacts?.buildUrl ?? b.artifacts?.applicationArchiveUrl ?? null,
    createdAt: b.createdAt ?? new Date().toISOString(),
  };
}

export async function getBuildStatus(
  buildId: string
): Promise<BuildStatus> {
  const res = await fetch(`${EAS_API}/v2/builds/${buildId}`, {
    method: "GET",
    headers: headers(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`EAS API error (${res.status}): ${body}`);
  }

  const data = await res.json();

  return {
    id: data.id ?? buildId,
    status: data.status ?? "in-queue",
    platform: data.platform ?? null,
    downloadUrl: data.artifacts?.buildUrl ?? data.artifacts?.applicationArchiveUrl ?? null,
    error: data.error?.message ?? null,
  };
}
