import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

type Theme = { primary: string; background: string; text: string; mutedText: string };

type Props = {
  categories: { id: string; name: string }[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  theme: Theme;
};

export function CategoryFilter({ categories, activeId, onSelect, theme }: Props) {
  const allActive = activeId === null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <Pressable
        style={[
          styles.chip,
          { backgroundColor: allActive ? theme.primary : theme.background, borderColor: theme.primary },
        ]}
        onPress={() => onSelect(null)}
      >
        <Text style={[styles.label, { color: allActive ? "#fff" : theme.text }]}>All</Text>
      </Pressable>

      {categories.map((cat) => {
        const active = cat.id === activeId;
        return (
          <Pressable
            key={cat.id}
            style={[
              styles.chip,
              { backgroundColor: active ? theme.primary : theme.background, borderColor: theme.primary },
            ]}
            onPress={() => onSelect(cat.id)}
          >
            <Text style={[styles.label, { color: active ? "#fff" : theme.text }]}>{cat.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
  },
});
