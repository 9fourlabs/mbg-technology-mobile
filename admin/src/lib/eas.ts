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
    downloadUrl: data.artifacts?.buildUrl ?? null,
    error: data.error?.message ?? null,
  };
}
