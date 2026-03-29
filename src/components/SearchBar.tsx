import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

type Theme = { primary: string; background: string; text: string; mutedText: string };

type Props = {
  placeholder?: string;
  onSearch: (query: string) => void;
  theme: Theme;
};

export function SearchBar({ placeholder = "Search...", onSearch, theme }: Props) {
  const [value, setValue] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(value), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, onSearch]);

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.mutedText }]}
        placeholder={placeholder}
        placeholderTextColor={theme.mutedText}
        value={value}
        onChangeText={setValue}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
});
