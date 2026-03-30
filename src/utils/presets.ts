import type { DesignConfig } from "../templates/types";

export type ResolvedDesign = Required<Omit<DesignConfig, "preset" | "secondaryColor" | "typography">> & {
  headingSize: number;
  bodySize: number;
  secondaryColor: string | null;
};

const PRESETS: Record<string, DesignConfig> = {
  modern: { cardStyle: "rounded", cardColumns: 2, buttonRadius: 999, headerStyle: "left", tabBarStyle: "pills", typography: { headingSize: "medium", bodySize: "medium" } },
  classic: { cardStyle: "sharp", cardColumns: 1, buttonRadius: 8, headerStyle: "left", tabBarStyle: "underline", typography: { headingSize: "large", bodySize: "medium" } },
  minimal: { cardStyle: "flat", cardColumns: 1, buttonRadius: 4, headerStyle: "centered", tabBarStyle: "underline", typography: { headingSize: "small", bodySize: "small" } },
  bold: { cardStyle: "rounded", cardColumns: 1, buttonRadius: 12, headerStyle: "left", tabBarStyle: "pills", typography: { headingSize: "large", bodySize: "large" } },
  elegant: { cardStyle: "rounded", cardColumns: 1, buttonRadius: 999, headerStyle: "centered", tabBarStyle: "underline", typography: { headingSize: "medium", bodySize: "medium" } },
};

const SIZE_MAP = { small: 14, medium: 16, large: 20 };
const HEADING_SIZE_MAP = { small: 20, medium: 24, large: 32 };

export function resolveDesign(config?: DesignConfig): ResolvedDesign {
  const preset = PRESETS[config?.preset ?? "modern"] ?? PRESETS.modern;
  const merged = { ...preset, ...config };
  return {
    cardStyle: merged.cardStyle ?? "rounded",
    cardColumns: merged.cardColumns ?? 1,
    buttonRadius: merged.buttonRadius ?? 8,
    headerStyle: merged.headerStyle ?? "left",
    tabBarStyle: merged.tabBarStyle ?? "pills",
    headingSize: HEADING_SIZE_MAP[merged.typography?.headingSize ?? "medium"],
    bodySize: SIZE_MAP[merged.typography?.bodySize ?? "medium"],
    secondaryColor: merged.secondaryColor ?? null,
  };
}
