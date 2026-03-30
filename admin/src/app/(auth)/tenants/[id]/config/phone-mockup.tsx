"use client";

import { useState } from "react";

// Replicate theme logic from src/utils/theme.ts + src/utils/presets.ts
function hexToRgb(hex: string) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function hexLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

const CARD_RADIUS: Record<string, number> = { rounded: 16, sharp: 2, flat: 0 };
const HEADING_PX: Record<string, number> = { small: 20, medium: 24, large: 32 };
const BODY_PX: Record<string, number> = { small: 14, medium: 16, large: 20 };

interface Tab {
  id: string;
  label: string;
  headerTitle: string;
  headerBody: string;
  cards?: Card[];
}

interface Card {
  id: string;
  imageUri?: string;
  title: string;
  body: string;
  action?: {
    type: string;
    url?: string;
    label?: string;
    variant?: string;
  };
}

interface PhoneMockupProps {
  config: Record<string, unknown>;
}

export default function PhoneMockup({ config }: PhoneMockupProps) {
  const brand = (config?.brand ?? {}) as Record<string, string>;
  const design = (config?.design ?? {}) as Record<string, unknown>;
  const tabs = (config?.tabs ?? []) as Tab[];
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  // Theme derivation
  const bg = brand.backgroundColor ?? "#000000";
  const text = brand.textColor ?? "#ffffff";
  const muted = brand.mutedTextColor ?? "#999999";
  const primary = brand.primaryColor ?? "#2563EB";
  const isLight = hexLuminance(bg) > 0.5;

  const cardBg = isLight ? "#F1F5F9" : "#0d0d0d";
  const borderColor = isLight ? "#E2E8F0" : "#1a1a1a";
  const tabBarBg = isLight ? "#FFFFFF" : "#050505";

  const cardStyle = (design.cardStyle as string) ?? "rounded";
  const cardRadius = CARD_RADIUS[cardStyle] ?? 16;
  const buttonRadius = typeof design.buttonRadius === "number"
    ? Math.min(design.buttonRadius as number, 999)
    : 8;
  const cardCols = (design.cardColumns as number) ?? 1;
  const headerAlign = (design.headerStyle as string) === "centered" ? "center" : "left";
  const tabBarStyle = (design.tabBarStyle as string) ?? "pills";
  const typo = (design.typography ?? {}) as Record<string, string>;
  const headingSize = HEADING_PX[typo.headingSize ?? "medium"] ?? 24;
  const bodySize = BODY_PX[typo.bodySize ?? "medium"] ?? 16;

  const activeTab = tabs[activeTabIdx] ?? null;
  const cards = activeTab?.cards ?? [];

  return (
    <div className="w-[300px] flex-shrink-0">
      <p className="text-xs text-gray-500 mb-3 text-center">Live Preview</p>
      {/* Phone frame */}
      <div
        className="relative mx-auto rounded-[40px] border-[3px] overflow-hidden shadow-2xl"
        style={{
          width: 300,
          height: 620,
          borderColor: isLight ? "#d1d5db" : "#374151",
          backgroundColor: bg,
        }}
      >
        {/* Dynamic Island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[90px] h-[25px] bg-black rounded-full z-20" />

        {/* Status bar */}
        <div
          className="flex items-center justify-between px-6 pt-4 pb-1 text-[9px] font-medium z-10 relative"
          style={{ color: muted }}
        >
          <span>9:41</span>
          <span>●●● ▌</span>
        </div>

        {/* Scrollable content area */}
        <div
          className="overflow-y-auto px-4 pb-16"
          style={{ height: 620 - 80 - 32 }}
        >
          {/* Logo */}
          {brand.logoUri && (
            <div className="flex justify-center my-3">
              <img
                src={brand.logoUri}
                alt="Logo"
                className="h-8 w-auto object-contain"
                style={{ maxWidth: 120 }}
              />
            </div>
          )}

          {/* Header */}
          {activeTab && (
            <div className="mb-3" style={{ textAlign: headerAlign as "center" | "left" }}>
              <h1
                className="font-bold leading-tight"
                style={{ color: text, fontSize: headingSize * 0.65 }}
              >
                {activeTab.headerTitle}
              </h1>
              <p
                className="mt-1 leading-snug"
                style={{ color: muted, fontSize: bodySize * 0.65 }}
              >
                {activeTab.headerBody}
              </p>
            </div>
          )}

          {/* Cards */}
          {cards.length > 0 ? (
            <div
              className="gap-2"
              style={{
                display: "grid",
                gridTemplateColumns: cardCols === 2 ? "1fr 1fr" : "1fr",
              }}
            >
              {cards.map((card) => (
                <div
                  key={card.id}
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: cardRadius * 0.65,
                    borderWidth: cardStyle === "flat" ? 0 : 1,
                    borderStyle: "solid",
                    borderColor: borderColor,
                    overflow: "hidden",
                  }}
                >
                  {card.imageUri && (
                    <img
                      src={card.imageUri}
                      alt=""
                      className="w-full object-cover"
                      style={{ height: cardCols === 2 ? 60 : 80 }}
                    />
                  )}
                  <div className="p-2">
                    <p
                      className="font-semibold leading-tight"
                      style={{
                        color: text,
                        fontSize: Math.max(9, headingSize * 0.45),
                      }}
                    >
                      {card.title}
                    </p>
                    <p
                      className="mt-0.5 leading-snug"
                      style={{
                        color: muted,
                        fontSize: Math.max(8, bodySize * 0.55),
                      }}
                    >
                      {card.body.length > 60
                        ? card.body.slice(0, 60) + "..."
                        : card.body}
                    </p>
                    {card.action?.type === "open_url" && card.action.label && (
                      <div
                        className="mt-1.5 text-center font-medium"
                        style={{
                          backgroundColor:
                            card.action.variant === "secondary"
                              ? "transparent"
                              : primary,
                          color:
                            card.action.variant === "secondary" ? primary : "#fff",
                          borderRadius: Math.min(buttonRadius, 20) * 0.65,
                          border:
                            card.action.variant === "secondary"
                              ? `1px solid ${primary}`
                              : "none",
                          fontSize: 8,
                          padding: "3px 6px",
                        }}
                      >
                        {card.action.label}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab ? (
            <div
              className="flex items-center justify-center py-8 rounded-lg"
              style={{ backgroundColor: cardBg }}
            >
              <p style={{ color: muted, fontSize: 10 }}>
                No cards on this tab
              </p>
            </div>
          ) : (
            <div
              className="flex items-center justify-center py-8 rounded-lg"
              style={{ backgroundColor: cardBg }}
            >
              <p style={{ color: muted, fontSize: 10 }}>No tabs configured</p>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-2 py-2 border-t"
          style={{
            backgroundColor: tabBarBg,
            borderColor: borderColor,
            minHeight: 44,
          }}
        >
          {tabs.length > 0
            ? tabs.map((tab, i) => {
                const isActive = i === activeTabIdx;
                if (tabBarStyle === "underline") {
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTabIdx(i)}
                      className="flex flex-col items-center gap-0.5"
                      style={{
                        borderBottom: isActive
                          ? `2px solid ${primary}`
                          : "2px solid transparent",
                        paddingBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          color: isActive ? primary : muted,
                          fontSize: 9,
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        {tab.label}
                      </span>
                    </button>
                  );
                }
                // pills
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabIdx(i)}
                    className="px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: isActive ? primary + "20" : "transparent",
                      color: isActive ? primary : muted,
                      fontSize: 9,
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })
            : (
              <span style={{ color: muted, fontSize: 9 }}>No tabs</span>
            )}
        </div>

        {/* Home indicator */}
        <div
          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[80px] h-[4px] rounded-full"
          style={{ backgroundColor: isLight ? "#00000030" : "#ffffff30" }}
        />
      </div>
    </div>
  );
}
