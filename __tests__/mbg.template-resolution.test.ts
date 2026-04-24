/**
 * Template-resolution tests — when the mobile app asks for "mbg"'s
 * informational template, does it get the config we actually shipped?
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getInformationalTemplate } from "../src/templates/informational";

const mbgJson = JSON.parse(
  readFileSync(resolve(__dirname, "../configs/tenants/mbg.json"), "utf-8"),
);

describe("Informational template resolution", () => {
  it("returns the MBG config when the tenant is 'mbg'", () => {
    const tpl = getInformationalTemplate("mbg");
    expect(tpl.templateId).toBe("informational");
    expect(tpl.tabs).toHaveLength(mbgJson.tabs.length);
    expect(tpl.brand.primaryColor).toBe(mbgJson.brand.primaryColor);
  });

  it("falls back to MBG when an unknown tenant is requested", () => {
    const tpl = getInformationalTemplate("does-not-exist");
    expect(tpl.templateId).toBe("informational");
    // Fallback is the MBG config (current default; see templates/informational/index.ts).
    expect(tpl.brand.primaryColor).toBe(mbgJson.brand.primaryColor);
  });

  it("preserves tab order and IDs through the resolver", () => {
    const tpl = getInformationalTemplate("mbg");
    for (let i = 0; i < mbgJson.tabs.length; i++) {
      expect(tpl.tabs[i].id).toBe(mbgJson.tabs[i].id);
      expect(tpl.tabs[i].label).toBe(mbgJson.tabs[i].label);
    }
  });
});
