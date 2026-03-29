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
import type { AuthenticatedTemplate, TemplateAction } from "./templates/types";

const Stack = createNativeStackNavigator();

type Props = {
  template: AuthenticatedTemplate;
};

export default function AuthenticatedTemplateApp({ template }: Props) {
  return (
    <AuthProvider config={template.auth}>
      <NavigationContainer>
        <AppContent template={template} />
      </NavigationContainer>
    </AuthProvider>
  );
}

function AppContent({ template }: Props) {
  const { user, loading } = useAuth();
  const [activeTabId, setActiveTabId] = useState(template.tabs[0]?.id ?? "home");
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const theme = {
    primary: template.brand.primaryColor,
    background: template.brand.backgroundColor,
    text: template.brand.textColor,
    mutedText: template.brand.mutedTextColor,
  };

  const protectedSet = new Set(template.protectedTabs ?? []);

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
            template={template}
            theme={theme}
            activeTabId={activeTabId}
            onTabChange={(id) => handleTabChange(id, navigation)}
          />
        )}
      </Stack.Screen>
      <Stack.Group screenOptions={{ presentation: "modal" }}>
        <Stack.Screen name="Auth">
          {() => (
            <AuthStack
              brand={template.brand}
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
  template: AuthenticatedTemplate;
  theme: { primary: string; background: string; text: string; mutedText: string };
  activeTabId: string;
  onTabChange: (id: string) => void;
};

function MainContent({ template, theme, activeTabId, onTabChange }: MainContentProps) {
  const activeTab = template.tabs.find((t) => t.id === activeTabId) ?? template.tabs[0];
  const isProfile = activeTabId === "profile";

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
          <Image
            source={{ uri: template.brand.logoUri }}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isProfile ? (
            <ProfileScreen brand={template.brand} />
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

        <TabBar
          tabs={template.tabs.map((t) => ({ id: t.id, label: t.label }))}
          activeId={activeTabId}
          onChange={onTabChange}
          theme={theme}
        />
      </View>
    </SafeAreaView>
  );
}

type AuthStackProps = {
  brand: AuthenticatedTemplate["brand"];
  onSuccess: () => void;
};

function AuthStack({ brand, onSuccess }: AuthStackProps) {
  const { user } = useAuth();
  const AuthStackNav = createNativeStackNavigator();

  // Auto-dismiss when user logs in
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
  cardGrid: { marginBottom: 16 },
  footerSpacer: { height: 16 },
});
