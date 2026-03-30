import type { BrandConfig, DesignConfig } from "../templates/types";
import { resolveDesign, type ResolvedDesign } from "./presets";

export type Theme = {
  primary: string;
  background: string;
  text: string;
  mutedText: string;
  card: string;
  border: string;
  tabBar: string;
  tabBarActive: string;
  placeholder: string;
  danger: string;
  cardRadius: number;
  buttonRadius: number;
  headerAlign: "center" | "flex-start";
  cardColumns: number;
  tabBarVariant: "pills" | "underline";
  headingSize: number;
  bodySize: number;
  secondary: string;
};

/**
 * Parse a hex color string (#RGB or #RRGGBB) into { r, g, b } (0-255).
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

/**
 * Compute perceived luminance of a hex color (0-1 range).
 * Formula: (0.299*r + 0.587*g + 0.114*b) / 255
 */
export function hexToLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Derive a secondary color from a primary hex color.
 * Lightens on dark backgrounds, darkens on light backgrounds.
 */
function deriveSecondary(primary: string, isLight: boolean): string {
  const { r, g, b } = hexToRgb(primary);
  const factor = isLight ? 0.7 : 1.3;
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v * factor)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Build a full Theme object from a BrandConfig and optional DesignConfig.
 * Derives light/dark adaptive tokens from the background color luminance.
 */
export function buildTheme(brand: BrandConfig, design?: DesignConfig): Theme {
  const luminance = hexToLuminance(brand.backgroundColor);
  const isLight = luminance > 0.5;

  const resolved: ResolvedDesign = resolveDesign(design);

  const CARD_RADIUS_MAP: Record<string, number> = { rounded: 16, sharp: 2, flat: 0 };
  const cardRadius = CARD_RADIUS_MAP[resolved.cardStyle] ?? 16;

  const headerAlign: "center" | "flex-start" = resolved.headerStyle === "centered" ? "center" : "flex-start";

  const secondary = resolved.secondaryColor ?? deriveSecondary(brand.primaryColor, isLight);

  return {
    primary: brand.primaryColor,
    background: brand.backgroundColor,
    text: brand.textColor,
    mutedText: brand.mutedTextColor,
    card: isLight ? "#F1F5F9" : "#0d0d0d",
    border: isLight ? "#E2E8F0" : "#1a1a1a",
    tabBar: isLight ? "#FFFFFF" : "#050505",
    tabBarActive: isLight ? "#F1F5F9" : "#111111",
    placeholder: isLight ? "#E2E8F0" : "#111111",
    danger: isLight ? "#DC2626" : "#dc2626",
    cardRadius,
    buttonRadius: resolved.buttonRadius,
    headerAlign,
    cardColumns: resolved.cardColumns,
    tabBarVariant: resolved.tabBarStyle,
    headingSize: resolved.headingSize,
    bodySize: resolved.bodySize,
    secondary,
  };
}
