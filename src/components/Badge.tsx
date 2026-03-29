import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Theme = { primary: string; background: string; text: string; mutedText: string };

type Props = {
  label: string;
  color?: string;
  theme: Theme;
};

export function Badge({ label, color, theme }: Props) {
  const bg = color ?? theme.primary;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  label: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
