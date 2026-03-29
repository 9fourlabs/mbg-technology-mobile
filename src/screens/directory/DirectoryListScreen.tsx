import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SearchBar } from "../../components/SearchBar";
import { CategoryFilter } from "../../components/CategoryFilter";
import { EmptyState } from "../../components/EmptyState";
import { useDirectoryItems, type DirectoryItem } from "../../hooks/directory/useDirectoryItems";
import type { DirectoryConfig } from "../../templates/types";
import type { Theme } from "../../BaseAuthenticatedApp";

type Props = {
  config: DirectoryConfig;
  theme: Theme;
  onItemPress: (id: string) => void;
};

export function DirectoryListScreen({ config, theme, onItemPress }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const { data: items, loading, refetch } = useDirectoryItems(
    searchQuery,
    categoryId,
    config.fields
  );

  const firstSearchableField = config.fields.find((f) => f.searchable);

  const renderItem = useCallback(
    ({ item }: { item: DirectoryItem }) => {
      const subtitle = firstSearchableField
        ? item.data?.[firstSearchableField.key] ?? ""
        : "";

      return (
        <Pressable
          style={[styles.row, { borderBottomColor: theme.mutedText + "33" }]}
          onPress={() => onItemPress(item.id)}
        >
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary + "22" }]}>
              <Text style={[styles.avatarLetter, { color: theme.primary }]}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.rowText}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: theme.mutedText }]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </Pressable>
      );
    },
    [theme, onItemPress, firstSearchableField]
  );

  return (
    <View style={styles.container}>
      <SearchBar
        placeholder={`Search ${config.itemLabelPlural.toLowerCase()}...`}
        onSearch={setSearchQuery}
        theme={theme}
      />

      {config.categories.length > 0 && (
        <CategoryFilter
          categories={config.categories}
          activeId={categoryId}
          onSelect={setCategoryId}
          theme={theme}
        />
      )}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={loading}
          ListEmptyComponent={
            <EmptyState
              title={`No ${config.itemLabelPlural.toLowerCase()} found`}
              subtitle="Try adjusting your search or filters."
              theme={theme}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingBottom: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: "600",
  },
  rowText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});
