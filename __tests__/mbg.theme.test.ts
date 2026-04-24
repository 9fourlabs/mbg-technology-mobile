/**
 * Theme-builder tests — given the MBG brand + design config, does buildTheme
 * produce the expected colors/sizes that downstream components will honor?
 * Catches regressions in the design presets without needing to render RN.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildTheme } from "../src/utils/theme";

const config = JSON.parse(
  readFileSync(resolve(__dirname, "../configs/tenants/mbg.json"), "utf-8"),
) as {
  brand: {
    logoUri: string;
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    mutedTextColor: string;
  };
  design?: Record<string, unknown>;
};

describe("MBG theme", () => {
  const theme = buildTheme(config.brand, config.design as never);

  it("propagates brand colors into the theme object", () => {
    expect(theme.background).toBe(config.brand.backgroundColor);
    expect(theme.text).toBe(config.brand.textColor);
    expect(theme.mutedText).toBe(config.brand.mutedTextColor);
    expect(theme.primary).toBe(config.brand.primaryColor);
  });

  it("returns a border color distinct from background (visible on dark theme)", () => {
    expect(theme.border).toBeTruthy();
    expect(theme.border).not.toBe(theme.background);
  });

  it("applies the configured design preset (elegant → single column, underline tab bar)", () => {
    // MBG uses the elegant preset with explicit cardColumns=1 and tabBarStyle=underline.
    expect(theme.cardColumns).toBe(1);
    expect(theme.tabBarVariant).toBe("underline");
  });

  it("button radius stays within Apple HIG reasonable bounds", () => {
    expect(theme.buttonRadius).toBeGreaterThanOrEqual(0);
    expect(theme.buttonRadius).toBeLessThanOrEqual(28);
  });
});
