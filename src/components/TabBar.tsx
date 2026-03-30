import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Theme } from "../utils/theme";

type Props = {
  tabs: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
  theme: Theme;
};

export function TabBar({ tabs, activeId, onChange, theme }: Props) {
  const isUnderline = theme.tabBarVariant === "underline";

  return (
    <View
      style={[
        styles.tabBar,
        { backgroundColor: theme.tabBar, borderTopColor: theme.border },
        isUnderline && styles.tabBarUnderline,
      ]}
    >
      {tabs.map((t) => {
        const active = t.id === activeId;
        return (
          <Pressable
            key={t.id}
            onPress={() => onChange(t.id)}
            style={({ pressed }) => [
              styles.tabButton,
              // Pills variant: rounded background fill on active tab
              !isUnderline && active && [styles.tabButtonActivePills, { backgroundColor: theme.tabBarActive }],
              // Underline variant: 2px bottom border on active tab
              isUnderline && active && { borderBottomWidth: 2, borderBottomColor: theme.primary },
              pressed && styles.tabButtonPressed,
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                { color: theme.mutedText },
                active && { color: theme.primary },
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  tabBarUnderline: {
    borderBottomWidth: 0,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  tabButtonActivePills: {
    borderRadius: 999,
  },
  tabButtonPressed: {
    opacity: 0.8,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
