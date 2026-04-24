/**
 * CTA URL liveness checks — every open_url action in the MBG config must
 * point to a URL that responds 2xx/3xx. Catches dead links (the most
 * common way a production config silently breaks) without needing to
 * render the UI.
 *
 * Set SKIP_URL_LIVENESS=1 to skip in CI when network is restricted.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Card = {
  action?: { type: string; url?: string };
};

const config = JSON.parse(
  readFileSync(resolve(__dirname, "../configs/tenants/mbg.json"), "utf-8"),
) as { tabs: Array<{ cards: Card[] }> };

const ctaUrls = new Set<string>();
const imageUrls = new Set<string>();

for (const tab of config.tabs) {
  for (const card of tab.cards) {
    if (card.action?.type === "open_url" && card.action.url) {
      ctaUrls.add(card.action.url);
    }
    const cardAny = card as Record<string, unknown>;
    if (typeof cardAny.imageUri === "string") {
      imageUrls.add(cardAny.imageUri);
    }
  }
}

// brand.logoUri too
const logo = (config as unknown as { brand: { logoUri?: string } }).brand
  .logoUri;
if (logo) imageUrls.add(logo);

async function headOk(url: string, timeoutMs = 8000): Promise<number> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Use GET with a Range header so servers that reject HEAD (Cloudflare,
    // some CDNs) still answer cheaply. Follows redirects.
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { Range: "bytes=0-0", "User-Agent": "MBG-Production-Readiness/1.0" },
      signal: controller.signal,
    });
    return res.status;
  } finally {
    clearTimeout(timeout);
  }
}

const skip = process.env.SKIP_URL_LIVENESS === "1";
const maybe = skip ? describe.skip : describe;

maybe("MBG URL liveness", () => {
  jest.setTimeout(30000);

  it.each([...ctaUrls])("CTA URL is alive: %s", async (url) => {
    const status = await headOk(url);
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(400);
  });

  it.each([...imageUrls])("image URL is alive: %s", async (url) => {
    const status = await headOk(url);
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(400);
  });
});
