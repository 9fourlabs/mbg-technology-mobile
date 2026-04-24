/**
 * Config-shape tests — validate the committed mbg.json against the contract
 * every informational tenant must meet. Catches accidental deletions,
 * malformed actions, placeholder text, and dead CTAs.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CONFIG_PATH = resolve(__dirname, "../configs/tenants/mbg.json");

type Card = {
  id: string;
  title: string;
  body: string;
  imageUri?: string;
  action?:
    | { type: "open_url"; url: string; label: string; variant?: string }
    | { type: "none" };
};

type Tab = {
  id: string;
  label: string;
  headerTitle: string;
  headerBody: string;
  cards: Card[];
};

type Config = {
  templateId: string;
  brand: {
    logoUri: string;
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    mutedTextColor: string;
  };
  appStore?: {
    appName: string;
    appDescription?: string;
    appKeywords?: string[];
  };
  tabs: Tab[];
};

const config: Config = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));

describe("mbg.json config", () => {
  it("is an informational template", () => {
    expect(config.templateId).toBe("informational");
  });

  it("has a populated brand block with valid hex colors", () => {
    expect(config.brand.logoUri).toMatch(/^https?:\/\//);
    expect(config.brand.primaryColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(config.brand.backgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(config.brand.textColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(config.brand.mutedTextColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("has an appStore block with a reasonable name + description", () => {
    expect(config.appStore?.appName).toBeTruthy();
    expect(config.appStore?.appName.length).toBeGreaterThan(2);
    expect(config.appStore?.appName.length).toBeLessThanOrEqual(30);
    if (config.appStore?.appDescription) {
      // Apple short description limit is 170 but we can go longer for long-form.
      // Guard against accidental megablobs.
      expect(config.appStore.appDescription.length).toBeLessThan(4000);
    }
  });

  it("has between 1 and 6 tabs", () => {
    expect(config.tabs.length).toBeGreaterThanOrEqual(1);
    expect(config.tabs.length).toBeLessThanOrEqual(6);
  });

  it("every tab has a unique id and non-empty header copy", () => {
    const ids = new Set<string>();
    for (const tab of config.tabs) {
      expect(tab.id).toMatch(/^[a-z0-9-]+$/);
      expect(ids.has(tab.id)).toBe(false);
      ids.add(tab.id);
      expect(tab.label).toBeTruthy();
      expect(tab.headerTitle).toBeTruthy();
      expect(tab.headerBody).toBeTruthy();
    }
  });

  it("every card has title + body and no placeholder/dev text", () => {
    const placeholderPatterns = [
      /lorem ipsum/i,
      /placeholder/i,
      /\btodo\b/i,
      /\bfixme\b/i,
      /edit this/i,
      /replace me/i,
    ];
    for (const tab of config.tabs) {
      for (const card of tab.cards) {
        expect(card.id).toBeTruthy();
        expect(card.title).toBeTruthy();
        expect(card.body).toBeTruthy();
        const blob = `${card.title} ${card.body}`;
        for (const p of placeholderPatterns) {
          expect(blob).not.toMatch(p);
        }
      }
    }
  });

  it("every open_url action has a well-formed https URL", () => {
    for (const tab of config.tabs) {
      for (const card of tab.cards) {
        if (card.action?.type === "open_url") {
          expect(card.action.url).toMatch(/^https?:\/\//);
          expect(card.action.label).toBeTruthy();
          expect(card.action.label.length).toBeLessThan(40);
        }
      }
    }
  });

  it("no localhost URLs leaked into production tenant config", () => {
    const blob = JSON.stringify(config);
    expect(blob).not.toMatch(/localhost/);
    expect(blob).not.toMatch(/127\.0\.0\.1/);
  });
});
