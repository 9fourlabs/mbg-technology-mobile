"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";

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

interface Tab {
  id: string;
  label: string;
  headerTitle: string;
  headerBody: string;
  cards: Card[];
}

interface TabsEditorProps {
  tenantId: string;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

function generateId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "tab";
}

export default function TabsEditor({ tenantId, config, onChange }: TabsEditorProps) {
  const tabs = ((config?.tabs ?? []) as Tab[]).map((t) => ({
    ...t,
    cards: t.cards ?? [],
  }));
  const [selectedTabIdx, setSelectedTabIdx] = useState(0);
  const [editingCardIdx, setEditingCardIdx] = useState<number | null>(null);

  function updateTabs(newTabs: Tab[]) {
    onChange({ ...config, tabs: newTabs });
  }

  function addTab() {
    const n = tabs.length + 1;
    const newTab: Tab = {
      id: `tab-${n}`,
      label: `Tab ${n}`,
      headerTitle: `Tab ${n}`,
      headerBody: "Description here",
      cards: [],
    };
    updateTabs([...tabs, newTab]);
    setSelectedTabIdx(tabs.length);
  }

  function deleteTab(idx: number) {
    if (tabs.length <= 1) return;
    const newTabs = tabs.filter((_, i) => i !== idx);
    updateTabs(newTabs);
    setSelectedTabIdx(Math.min(selectedTabIdx, newTabs.length - 1));
  }

  function moveTab(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= tabs.length) return;
    const newTabs = [...tabs];
    [newTabs[idx], newTabs[newIdx]] = [newTabs[newIdx], newTabs[idx]];
    updateTabs(newTabs);
    setSelectedTabIdx(newIdx);
  }

  function updateTab(idx: number, field: keyof Tab, value: string) {
    const newTabs = [...tabs];
    newTabs[idx] = { ...newTabs[idx], [field]: value };
    if (field === "label") {
      newTabs[idx].id = generateId(value);
    }
    updateTabs(newTabs);
  }

  function addCard() {
    const tab = tabs[selectedTabIdx];
    if (!tab) return;
    const n = tab.cards.length + 1;
    const newCard: Card = {
      id: `${tab.id}-card-${n}`,
      title: `Card ${n}`,
      body: "Card description",
    };
    const newTabs = [...tabs];
    newTabs[selectedTabIdx] = { ...tab, cards: [...tab.cards, newCard] };
    updateTabs(newTabs);
    setEditingCardIdx(tab.cards.length);
  }

  function deleteCard(cardIdx: number) {
    const tab = tabs[selectedTabIdx];
    if (!tab) return;
    const newTabs = [...tabs];
    newTabs[selectedTabIdx] = {
      ...tab,
      cards: tab.cards.filter((_, i) => i !== cardIdx),
    };
    updateTabs(newTabs);
    setEditingCardIdx(null);
  }

  function updateCard(cardIdx: number, updates: Partial<Card>) {
    const tab = tabs[selectedTabIdx];
    if (!tab) return;
    const newTabs = [...tabs];
    const newCards = [...tab.cards];
    newCards[cardIdx] = { ...newCards[cardIdx], ...updates };
    newTabs[selectedTabIdx] = { ...tab, cards: newCards };
    updateTabs(newTabs);
  }

  function moveCard(cardIdx: number, dir: -1 | 1) {
    const tab = tabs[selectedTabIdx];
    if (!tab) return;
    const newIdx = cardIdx + dir;
    if (newIdx < 0 || newIdx >= tab.cards.length) return;
    const newCards = [...tab.cards];
    [newCards[cardIdx], newCards[newIdx]] = [newCards[newIdx], newCards[cardIdx]];
    const newTabs = [...tabs];
    newTabs[selectedTabIdx] = { ...tab, cards: newCards };
    updateTabs(newTabs);
    setEditingCardIdx(newIdx);
  }

  const selectedTab = tabs[selectedTabIdx] ?? null;

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-1">Tabs & Content</h2>
      <p className="text-sm text-gray-500 mb-4">
        Each tab is a page in your app with its own header and cards.
      </p>

      <div className="flex gap-4">
        {/* Tab list sidebar */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {tabs.map((tab, i) => (
            <div
              key={i}
              className={`flex items-center gap-1 rounded-lg px-2 py-2 cursor-pointer transition-colors ${
                i === selectedTabIdx
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-150"
              }`}
              onClick={() => { setSelectedTabIdx(i); setEditingCardIdx(null); }}
            >
              <div className="flex flex-col gap-0.5 mr-1">
                <button
                  onClick={(e) => { e.stopPropagation(); moveTab(i, -1); }}
                  className="text-[10px] opacity-50 hover:opacity-100"
                  disabled={i === 0}
                >
                  ▲
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); moveTab(i, 1); }}
                  className="text-[10px] opacity-50 hover:opacity-100"
                  disabled={i === tabs.length - 1}
                >
                  ▼
                </button>
              </div>
              <span className="text-sm font-medium flex-1 truncate">{tab.label}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteTab(i); }}
                  className="text-xs opacity-40 hover:opacity-100 hover:text-red-400"
                  title="Delete tab"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addTab}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors"
          >
            + Add Tab
          </button>
        </div>

        {/* Tab editor */}
        <div className="flex-1 min-w-0">
          {selectedTab ? (
            <div className="space-y-4">
              {/* Tab fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Label (tab bar)</label>
                  <input
                    type="text"
                    value={selectedTab.label}
                    onChange={(e) => updateTab(selectedTabIdx, "label", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-gray-100 border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">ID</label>
                  <input
                    type="text"
                    value={selectedTab.id}
                    onChange={(e) => {
                      const newTabs = [...tabs];
                      newTabs[selectedTabIdx] = { ...newTabs[selectedTabIdx], id: e.target.value };
                      updateTabs(newTabs);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-gray-100 border border-gray-300 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Page Title</label>
                <input
                  type="text"
                  value={selectedTab.headerTitle}
                  onChange={(e) => updateTab(selectedTabIdx, "headerTitle", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-100 border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Page Subtitle</label>
                <textarea
                  value={selectedTab.headerBody}
                  onChange={(e) => updateTab(selectedTabIdx, "headerBody", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-gray-100 border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Cards */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Cards ({selectedTab.cards.length})
                  </h3>
                  <button
                    onClick={addCard}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    + Add Card
                  </button>
                </div>

                {selectedTab.cards.length === 0 ? (
                  <div className="text-center py-6 rounded-lg bg-gray-50 border border-dashed border-gray-300">
                    <p className="text-sm text-gray-400 mb-2">No cards yet</p>
                    <button
                      onClick={addCard}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      Add your first card
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedTab.cards.map((card, ci) => (
                      <div key={ci}>
                        {/* Card summary row */}
                        <div
                          className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                            editingCardIdx === ci
                              ? "bg-gray-100 border-blue-600"
                              : "bg-gray-50 border-gray-300 hover:border-gray-400"
                          }`}
                          onClick={() => setEditingCardIdx(editingCardIdx === ci ? null : ci)}
                        >
                          {card.imageUri && (
                            <img src={card.imageUri} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 font-medium truncate">{card.title}</p>
                            <p className="text-xs text-gray-400 truncate">{card.body}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); moveCard(ci, -1); }} disabled={ci === 0} className="text-[10px] text-gray-400 hover:text-gray-900 disabled:opacity-30">▲</button>
                            <button onClick={(e) => { e.stopPropagation(); moveCard(ci, 1); }} disabled={ci === selectedTab.cards.length - 1} className="text-[10px] text-gray-400 hover:text-gray-900 disabled:opacity-30">▼</button>
                            <button onClick={(e) => { e.stopPropagation(); deleteCard(ci); }} className="text-xs text-gray-400 hover:text-red-400 ml-1">✕</button>
                          </div>
                        </div>

                        {/* Card edit form */}
                        {editingCardIdx === ci && (
                          <div className="ml-2 mt-1 p-3 rounded-lg bg-gray-100 border border-gray-300 space-y-3">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Title</label>
                              <input
                                type="text"
                                value={card.title}
                                onChange={(e) => updateCard(ci, { title: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Body</label>
                              <textarea
                                value={card.body}
                                onChange={(e) => updateCard(ci, { body: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              />
                            </div>
                            <div>
                              <ImageUploader
                                tenantId={tenantId}
                                category={`card-${selectedTab.id}-${ci}`}
                                label="Card Image"
                                currentUrl={card.imageUri}
                                onUpload={(url) => updateCard(ci, { imageUri: url })}
                              />
                            </div>
                            {/* Action */}
                            <div className="border-t border-gray-300 pt-3">
                              <label className="block text-xs text-gray-400 mb-2">Button Action</label>
                              <div className="flex gap-2 mb-2">
                                <button
                                  onClick={() => updateCard(ci, { action: { type: "open_url", url: card.action?.url ?? "", label: card.action?.label ?? "Learn more", variant: "primary" } })}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    card.action?.type === "open_url" ? "bg-blue-600 text-white" : "bg-white text-gray-500"
                                  }`}
                                >
                                  Open URL
                                </button>
                                <button
                                  onClick={() => updateCard(ci, { action: { type: "none" } })}
                                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    !card.action || card.action.type === "none" ? "bg-blue-600 text-white" : "bg-white text-gray-500"
                                  }`}
                                >
                                  None
                                </button>
                              </div>
                              {card.action?.type === "open_url" && (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={card.action.label ?? ""}
                                    onChange={(e) => updateCard(ci, { action: { ...card.action!, label: e.target.value } })}
                                    placeholder="Button label"
                                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <input
                                    type="text"
                                    value={card.action.url ?? ""}
                                    onChange={(e) => updateCard(ci, { action: { ...card.action!, url: e.target.value } })}
                                    placeholder="https://..."
                                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <div className="flex gap-2">
                                    {(["primary", "secondary"] as const).map((v) => (
                                      <button
                                        key={v}
                                        onClick={() => updateCard(ci, { action: { ...card.action!, variant: v } })}
                                        className={`flex-1 py-1 rounded text-xs font-medium ${
                                          (card.action?.variant ?? "primary") === v ? "bg-blue-600 text-white" : "bg-white text-gray-500"
                                        }`}
                                      >
                                        {v}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Add a tab to get started.</p>
          )}
        </div>
      </div>
    </div>
  );
}
