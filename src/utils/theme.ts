import type { BrandConfig } from "../templates/types";

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
 * Build a full Theme object from a BrandConfig.
 * Derives light/dark adaptive tokens from the background color luminance.
 */
export function buildTheme(brand: BrandConfig): Theme {
  const luminance = hexToLuminance(brand.backgroundColor);
  const isLight = luminance > 0.5;

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
  };
}
