import fs from "node:fs/promises";
import path from "node:path";

const CONSULTANT_DIR = path.join(process.cwd(), "content", "consultant");

export type ConsultantGuide = {
  slug: string;
  title: string;
  order: number;
};

const ORDER: Record<string, { title: string; order: number }> = {
  README: { title: "Overview", order: 0 },
  "getting-started": { title: "Getting Started", order: 1 },
  glossary: { title: "Glossary", order: 2 },
  "choosing-a-template": { title: "Choosing a Template", order: 3 },
  "onboarding-a-client": { title: "Onboarding a Client", order: 4 },
  "configuring-an-app": { title: "Configuring an App", order: 5 },
  "content-and-updates": { title: "Content and Updates", order: 6 },
  "sending-push": { title: "Sending Push Notifications", order: 7 },
  "analytics-explained": { title: "Analytics Explained", order: 8 },
  troubleshooting: { title: "Troubleshooting", order: 9 },
};

export async function listGuides(): Promise<ConsultantGuide[]> {
  const entries = await fs.readdir(CONSULTANT_DIR);
  return entries
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const stem = f.replace(/\.md$/, "");
      const meta = ORDER[stem] ?? { title: stem, order: 99 };
      return { slug: stem, title: meta.title, order: meta.order };
    })
    .sort((a, b) => a.order - b.order);
}

export async function readGuide(slug: string): Promise<string | null> {
  const safe = slug.replace(/[^a-z0-9-]/gi, "");
  const file = path.join(CONSULTANT_DIR, `${safe}.md`);
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return null;
  }
}

export async function readIndex(): Promise<string> {
  const content = await readGuide("README");
  return content ?? "# Consultant Guide\n\nDocs are being set up.";
}
