import { useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { Image, Linking, SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { PageHeader } from "./components/PageHeader";
import { TabBar } from "./components/TabBar";
import { TemplateCard } from "./components/TemplateCard";
import { getInformationalTemplate } from "./templates/informational";
import { buildTheme } from "./utils/theme";
import type { TemplateAction } from "./templates/types";

export default function TemplateApp() {
  const tenant = (Constants.expoConfig?.extra as any)?.tenant ?? "mbg";
  const template = useMemo(() => getInformationalTemplate(String(tenant)), [tenant]);
  const [activeTabId, setActiveTabId] = useState(template.tabs[0]?.id ?? "home");

  const theme = buildTheme(template.brand, template.design);

  async function onAction(action: TemplateAction) {
    if (action.type !== "open_url") return;
    try {
      const canOpen = await Linking.canOpenURL(action.url);
      if (!canOpen) return;
      await Linking.openURL(action.url);
    } catch {
      // ignore
    }
  }

  const activeTab = template.tabs.find((t) => t.id === activeTabId) ?? template.tabs[0];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.nav, { borderBottomColor: theme.border }]}>
          <Image source={{ uri: template.brand.logoUri }} style={styles.logo} resizeMode="contain" />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <PageHeader
            title={activeTab.headerTitle}
            body={activeTab.headerBody}
            colors={{ text: theme.text, muted: theme.mutedText }}
            headerAlign={theme.headerAlign}
            headingSize={theme.headingSize}
            bodySize={theme.bodySize}
          />

          {theme.cardColumns === 2 ? (
            <View style={styles.cardRow}>
              {activeTab.cards.map((card) => (
                <View key={card.id} style={styles.cardHalf}>
                  <TemplateCard card={card} theme={theme} onAction={onAction} />
                </View>
              ))}
            </View>
          ) : (
            activeTab.cards.map((card) => (
              <View key={card.id} style={styles.cardGrid}>
                <TemplateCard card={card} theme={theme} onAction={onAction} />
              </View>
            ))
          )}

          <View style={styles.footerSpacer} />
        </ScrollView>

        <TabBar
          tabs={template.tabs.map((t) => ({ id: t.id, label: t.label }))}
          activeId={activeTabId}
          onChange={setActiveTabId}
          theme={theme}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  root: { flex: 1 },
  nav: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  logo: { width: 56, height: 56, alignSelf: "flex-start" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 96 },
  cardGrid: { marginBottom: 16 },
  cardRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" } as const,
  cardHalf: { width: "48%", marginBottom: 16 } as const,
  footerSpacer: { height: 16 },
});
