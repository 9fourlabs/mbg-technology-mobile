const API = "https://api.github.com";

function getToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN environment variable is not set");
  return token;
}

function getRepo(): string {
  const repo = process.env.GITHUB_REPO;
  if (!repo) throw new Error("GITHUB_REPO environment variable is not set");
  return repo;
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${getToken()}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error (${res.status}): ${body}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Get a file's content and SHA from the repo. Returns base64-encoded content
 * and the SHA needed for subsequent updates.
 */
export async function getFileContent(path: string) {
  const repo = getRepo();
  const res = await fetch(`${API}/repos/${repo}/contents/${path}`, {
    method: "GET",
    headers: headers(),
  });
  return handleResponse<{
    sha: string;
    content: string;
    encoding: string;
    path: string;
  }>(res);
}

/**
 * Create or update a file in the repo. If the file already exists you must
 * supply the current SHA (fetch it first with getFileContent).
 */
export async function commitFile(
  path: string,
  content: string,
  message: string,
  branch?: string,
  sha?: string
) {
  const repo = getRepo();
  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content).toString("base64"),
  };
  if (branch) body.branch = branch;
  if (sha) body.sha = sha;

  const res = await fetch(`${API}/repos/${repo}/contents/${path}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(body),
  });
  return handleResponse<{
    content: { path: string; sha: string };
    commit: { sha: string; message: string };
  }>(res);
}

/**
 * Create a new branch from a given ref (defaults to "main").
 */
export async function createBranch(
  branchName: string,
  fromRef: string = "main"
) {
  const repo = getRepo();

  // Resolve the SHA of the source ref
  const refRes = await fetch(
    `${API}/repos/${repo}/git/ref/heads/${fromRef}`,
    { method: "GET", headers: headers() }
  );
  const refData = await handleResponse<{
    object: { sha: string };
  }>(refRes);

  const res = await fetch(`${API}/repos/${repo}/git/refs`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: refData.object.sha,
    }),
  });
  return handleResponse<{
    ref: string;
    object: { sha: string };
  }>(res);
}

/**
 * Open a pull request.
 */
export async function createPullRequest(
  title: string,
  body: string,
  head: string,
  base: string = "main"
) {
  const repo = getRepo();
  const res = await fetch(`${API}/repos/${repo}/pulls`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ title, body, head, base }),
  });
  return handleResponse<{
    number: number;
    html_url: string;
    title: string;
  }>(res);
}

/**
 * Trigger a workflow_dispatch event on a GitHub Actions workflow.
 */
export async function triggerWorkflowDispatch(
  workflowId: string,
  ref: string,
  inputs: Record<string, string> = {}
) {
  const repo = getRepo();
  const res = await fetch(
    `${API}/repos/${repo}/actions/workflows/${workflowId}/dispatches`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ ref, inputs }),
    }
  );
  // workflow_dispatch returns 204 on success with no body
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error (${res.status}): ${body}`);
  }
}

// ---------------------------------------------------------------------------
// High-level tenant operations
// ---------------------------------------------------------------------------

/**
 * Create a branch, commit the .ts and .json tenant config files, and return
 * the branch name and commit SHA.
 */
export async function commitTenantConfig(
  tenantId: string,
  tsContent: string,
  jsonContent: string,
): Promise<{ branch: string; sha: string }> {
  const timestamp = Date.now();
  const branch = `admin/tenant-${tenantId}-${timestamp}`;

  await createBranch(branch, "main");

  // Commit .json config
  const jsonResult = await commitFile(
    `configs/tenants/${tenantId}.json`,
    jsonContent,
    `chore: add/update ${tenantId} config (json)`,
    branch,
  );

  // Commit .ts config
  const tsResult = await commitFile(
    `configs/tenants-src/${tenantId}.ts`,
    tsContent,
    `chore: add/update ${tenantId} config (ts)`,
    branch,
  );

  return { branch, sha: tsResult.commit.sha };
}

/**
 * Open a PR from a tenant config branch to main.
 */
export async function createTenantPullRequest(
  branch: string,
  tenantId: string,
  templateType: string,
): Promise<{ url: string; number: number }> {
  const pr = await createPullRequest(
    `[Admin] Add/update tenant: ${tenantId} (${templateType})`,
    `Auto-generated by MBG Admin panel.\n\n- Tenant: \`${tenantId}\`\n- Template: \`${templateType}\``,
    branch,
    "main",
  );
  return { url: pr.html_url, number: pr.number };
}

/**
 * Update the tenantProjects.ts file to add or update a tenant's Expo project ID.
 */
export async function updateTenantProjects(
  tenantId: string,
  projectId: string,
): Promise<void> {
  const filePath = "configs/tenantProjects.ts";

  let existingContent = "";
  let existingSha: string | undefined;

  try {
    const file = await getFileContent(filePath);
    existingContent = Buffer.from(file.content, "base64").toString("utf-8");
    existingSha = file.sha;
  } catch {
    // File does not exist yet; create it fresh.
    existingContent = `// Auto-managed by MBG Admin — maps tenant IDs to Expo project IDs.
export const tenantProjects: Record<string, string> = {
};
`;
  }

  // Upsert the tenant entry
  const entryRegex = new RegExp(
    `(["'])${escapeRegex(tenantId)}\\1\\s*:\\s*["'][^"']*["']\\s*,?`,
  );
  const newEntry = `  "${tenantId}": "${projectId}",`;

  let updatedContent: string;
  if (entryRegex.test(existingContent)) {
    updatedContent = existingContent.replace(entryRegex, newEntry);
  } else {
    // Insert before the closing brace
    updatedContent = existingContent.replace(
      /};?\s*$/,
      `${newEntry}\n};\n`,
    );
  }

  await commitFile(
    filePath,
    updatedContent,
    `chore: update tenantProjects for ${tenantId}`,
    undefined,
    existingSha,
  );
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
