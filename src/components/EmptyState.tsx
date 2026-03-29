import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Theme = { primary: string; background: string; text: string; mutedText: string };

type Props = {
  title: string;
  subtitle?: string;
  theme: Theme;
};

export function EmptyState({ title, subtitle, theme }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.mutedText }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
