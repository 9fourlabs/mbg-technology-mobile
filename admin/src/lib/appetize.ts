/**
 * Appetize.io API client — uploads APKs for browser-based app previews.
 *
 * After a successful EAS build, we upload the APK to Appetize so the
 * share page can embed an interactive phone simulator.
 *
 * API docs: https://docs.appetize.io/rest-api/create-new-app
 */

const API = "https://api.appetize.io/v1/apps";

function getApiKey(): string {
  const key = process.env.APPETIZE_API_KEY;
  if (!key) throw new Error("APPETIZE_API_KEY environment variable is not set");
  return key;
}

function headers(): HeadersInit {
  return {
    "X-API-KEY": getApiKey(),
    "Content-Type": "application/json",
  };
}

interface AppetizeApp {
  publicKey: string;
  created: string;
  updated: string;
  platform: string;
}

/**
 * Upload a new app to Appetize. Returns the publicKey used for embedding.
 *
 * @param apkUrl - Public URL to the APK or IPA file (EAS artifact URL)
 * @param platform - "android" or "ios"
 * @param note - Display label in the Appetize dashboard
 */
export async function uploadToAppetize(
  apkUrl: string,
  platform: "android" | "ios",
  note: string,
): Promise<string> {
  const res = await fetch(API, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      url: apkUrl,
      platform,
      note,
      timeout: 300, // 5-minute session timeout
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Appetize API error (${res.status}): ${body}`);
  }

  const data = (await res.json()) as AppetizeApp;
  return data.publicKey;
}

/**
 * Update an existing Appetize app with a new build artifact.
 * Reuses the same publicKey / embed URL so share links stay stable.
 *
 * @param publicKey - Existing Appetize app identifier
 * @param apkUrl - New APK/IPA URL to replace the current build
 */
export async function updateAppetizeApp(
  publicKey: string,
  apkUrl: string,
): Promise<void> {
  const res = await fetch(`${API}/${publicKey}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ url: apkUrl }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Appetize API error (${res.status}): ${body}`);
  }
}

/**
 * Build the embed URL for an Appetize app.
 */
export function getAppetizeEmbedUrl(
  publicKey: string,
  options: { device?: string; scale?: number; autoplay?: boolean } = {},
): string {
  const { device = "pixel7", scale = 75, autoplay = false } = options;
  return `https://appetize.io/embed/${publicKey}?device=${device}&scale=${scale}&autoplay=${autoplay}`;
}
