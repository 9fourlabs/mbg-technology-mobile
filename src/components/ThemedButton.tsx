import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

type Theme = { primary: string; background: string; text: string; mutedText: string };

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
  theme: Theme;
};

const DANGER = "#dc2626";

export function ThemedButton({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  theme,
}: Props) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  const bg = isPrimary ? theme.primary : isDanger ? DANGER : "transparent";
  const borderColor = isPrimary ? theme.primary : isDanger ? DANGER : theme.primary;
  const textColor = isPrimary || isDanger ? "#fff" : theme.primary;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor, opacity: disabled || loading ? 0.5 : pressed ? 0.8 : 1 },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
});
