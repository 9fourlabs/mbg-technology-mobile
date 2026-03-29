import React from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDirectoryItem } from "../../hooks/directory/useDirectoryItem";
import type { DirectoryConfig, DirectoryFieldDef } from "../../templates/types";
import type { Theme } from "../../BaseAuthenticatedApp";

type Props = {
  itemId: string;
  config: DirectoryConfig;
  theme: Theme;
  onBack: () => void;
};

export function DirectoryDetailScreen({ itemId, config, theme, onBack }: Props) {
  const { data: item, loading } = useDirectoryItem(itemId);

  if (loading || !item) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  function handleFieldPress(field: DirectoryFieldDef, value: string) {
    if (!value) return;
    switch (field.type) {
      case "phone":
        Linking.openURL(`tel:${value}`);
        break;
      case "email":
        Linking.openURL(`mailto:${value}`);
        break;
      case "url":
        Linking.openURL(value.startsWith("http") ? value : `https://${value}`);
        break;
    }
  }

  const isLinkable = (type: string) =>
    type === "phone" || type === "email" || type === "url";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.primary }]}>{"< Back"}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.image} />
        ) : null}

        <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>

        {config.fields.map((field) => {
          const value = item.data?.[field.key];
          if (value == null || value === "") return null;
          const stringValue = String(value);
          const linkable = isLinkable(field.type);

          return (
            <View key={field.key} style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>
                {field.label}
              </Text>
              {linkable ? (
                <Pressable onPress={() => handleFieldPress(field, stringValue)}>
                  <Text style={[styles.fieldValue, { color: theme.primary }]}>
                    {stringValue}
                  </Text>
                </Pressable>
              ) : (
                <Text style={[styles.fieldValue, { color: theme.text }]}>
                  {stringValue}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: { padding: 4, alignSelf: "flex-start" },
  backText: { fontSize: 16, fontWeight: "500" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32 },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },
  fieldRow: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    lineHeight: 22,
  },
});
