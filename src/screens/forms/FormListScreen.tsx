import React from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { FormsConfig } from "../../templates/types";
import type { Theme } from "../../BaseAuthenticatedApp";

type Props = {
  config: FormsConfig;
  theme: Theme;
  onFormPress: (formId: string) => void;
};

export function FormListScreen({ config, theme, onFormPress }: Props) {
  if (config.forms.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No Forms Available</Text>
        <Text style={[styles.emptyBody, { color: theme.mutedText }]}>
          There are no forms configured at this time.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={config.forms}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          style={[styles.formItem, { borderColor: theme.primary + "30" }]}
          onPress={() => onFormPress(item.id)}
        >
          <View style={styles.formContent}>
            <Text style={[styles.formTitle, { color: theme.text }]}>{item.title}</Text>
            {item.description ? (
              <Text style={[styles.formDescription, { color: theme.mutedText }]} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </View>
          <Text style={[styles.chevron, { color: theme.mutedText }]}>{">"}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 20,
  },
  formItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  formContent: {
    flex: 1,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  chevron: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
