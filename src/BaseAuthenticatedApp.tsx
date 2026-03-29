/**
 * Shared auth shell used by all authenticated template types.
 * Handles: AuthProvider, NavigationContainer, auth modal, TabBar, logo, profile tab.
 * Template-specific content is rendered via the `renderTab` callback.
 */
import React, { useCallback, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { LoginScreen } from "./screens/auth/LoginScreen";
import { SignUpScreen } from "./screens/auth/SignUpScreen";
import { ForgotPasswordScreen } from "./screens/auth/ForgotPasswordScreen";
import { ProfileScreen } from "./screens/auth/ProfileScreen";
import { PageHeader } from "./components/PageHeader";
import { TabBar } from "./components/TabBar";
import { TemplateCard } from "./components/TemplateCard";
import type { AuthConfig, BrandConfig, TemplateTab, TemplateAction } from "./templates/types";

export type Theme = {
  primary: string;
  background: string;
  text: string;
  mutedText: string;
};

type Props = {
  brand: BrandConfig;
  auth: AuthConfig;
  tabs: TemplateTab[];
  protectedTabs?: string[];
  /** Render custom content for a tab. Return null to use default card rendering. */
  renderTab?: (tabId: string, theme: Theme, navigation: any) => React.ReactNode | null;
  children?: React.ReactNode;
};

const Stack = createNativeStackNavigator();

export default function BaseAuthenticatedApp({ brand, auth, tabs, protectedTabs, renderTab }: Props) {
  return (
    <AuthProvider config={auth}>
      <NavigationContainer>
        <AppContent brand={brand} tabs={tabs} protectedTabs={protectedTabs} renderTab={renderTab} />
      </NavigationContainer>
    </AuthProvider>
  );
}

function AppContent({ brand, tabs, protectedTabs, renderTab }: Omit<Props, "auth">) {
  const { user, loading } = useAuth();
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id ?? "home");
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const theme: Theme = {
    primary: brand.primaryColor,
    background: brand.backgroundColor,
    text: brand.textColor,
    mutedText: brand.mutedTextColor,
  };

  const protectedSet = new Set(protectedTabs ?? []);

  const handleTabChange = useCallback(
    (tabId: string, navigation?: any) => {
      if (protectedSet.has(tabId) && !user) {
        setPendingTab(tabId);
        navigation?.navigate("Auth");
        return;
      }
      setActiveTabId(tabId);
    },
    [user, protectedSet]
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main">
        {({ navigation }) => (
          <MainContent
            brand={brand}
            tabs={tabs}
            theme={theme}
            activeTabId={activeTabId}
            onTabChange={(id) => handleTabChange(id, navigation)}
            renderTab={renderTab ? (tabId) => renderTab(tabId, theme, navigation) : undefined}
          />
        )}
      </Stack.Screen>
      <Stack.Group screenOptions={{ presentation: "modal" }}>
        <Stack.Screen name="Auth">
          {() => (
            <AuthStack
              brand={brand}
              onSuccess={() => {
                if (pendingTab) {
                  setActiveTabId(pendingTab);
                  setPendingTab(null);
                }
              }}
            />
          )}
        </Stack.Screen>
      </Stack.Group>
    </Stack.Navigator>
  );
}

type MainContentProps = {
  brand: BrandConfig;
  tabs: TemplateTab[];
  theme: Theme;
  activeTabId: string;
  onTabChange: (id: string) => void;
  renderTab?: (tabId: string) => React.ReactNode | null;
};

function MainContent({ brand, tabs, theme, activeTabId, onTabChange, renderTab }: MainContentProps) {
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const isProfile = activeTabId === "profile";

  // Check if the template wants to render custom content for this tab
  const customContent = !isProfile && renderTab ? renderTab(activeTabId) : null;

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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={styles.nav}>
          <Image source={{ uri: brand.logoUri }} style={styles.logo} resizeMode="contain" />
        </View>

        {customContent ? (
          // Template-specific screen (e.g. booking calendar, product catalog)
          <View style={styles.customContent}>{customContent}</View>
        ) : (
          // Default: card-based content or profile
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isProfile ? (
              <ProfileScreen brand={brand} />
            ) : (
              <>
                <PageHeader
                  title={activeTab.headerTitle}
                  body={activeTab.headerBody}
                  colors={{ text: theme.text, muted: theme.mutedText }}
                />
                {activeTab.cards.map((card) => (
                  <View key={card.id} style={styles.cardGrid}>
                    <TemplateCard card={card} theme={theme} onAction={onAction} />
                  </View>
                ))}
              </>
            )}
            <View style={styles.footerSpacer} />
          </ScrollView>
        )}

        <TabBar
          tabs={tabs.map((t) => ({ id: t.id, label: t.label }))}
          activeId={activeTabId}
          onChange={onTabChange}
          theme={theme}
        />
      </View>
    </SafeAreaView>
  );
}

function AuthStack({ brand, onSuccess }: { brand: BrandConfig; onSuccess: () => void }) {
  const { user } = useAuth();
  const AuthStackNav = createNativeStackNavigator();

  React.useEffect(() => {
    if (user) onSuccess();
  }, [user, onSuccess]);

  return (
    <AuthStackNav.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: brand.backgroundColor },
      }}
    >
      <AuthStackNav.Screen name="Login">
        {(props) => <LoginScreen {...props} brand={brand} />}
      </AuthStackNav.Screen>
      <AuthStackNav.Screen name="SignUp">
        {(props) => <SignUpScreen {...props} brand={brand} />}
      </AuthStackNav.Screen>
      <AuthStackNav.Screen name="ForgotPassword">
        {(props) => <ForgotPasswordScreen {...props} brand={brand} />}
      </AuthStackNav.Screen>
    </AuthStackNav.Navigator>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  root: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  nav: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  logo: { width: 56, height: 56, alignSelf: "flex-start" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 96 },
  customContent: { flex: 1 },
  cardGrid: { marginBottom: 16 },
  footerSpacer: { height: 16 },
});
