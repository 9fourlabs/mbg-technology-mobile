import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  tabs: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
  theme: { primary: string };
};

export function TabBar({ tabs, activeId, onChange, theme }: Props) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((t) => {
        const active = t.id === activeId;
        return (
          <Pressable
            key={t.id}
            onPress={() => onChange(t.id)}
            style={({ pressed }) => [
              styles.tabButton,
              active && styles.tabButtonActive,
              pressed && styles.tabButtonPressed,
            ]}
          >
            <Text style={[styles.tabButtonText, active && { color: theme.primary }]}>{t.label}</Text>
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
    borderTopColor: "#1a1a1a",
    backgroundColor: "#050505",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  tabButtonActive: {
    borderRadius: 999,
    backgroundColor: "#111111",
  },
  tabButtonPressed: {
    opacity: 0.8,
  },
  tabButtonText: {
    color: "#777",
    fontSize: 13,
    fontWeight: "600",
  },
});

