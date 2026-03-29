import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { EmptyState } from "../../components/EmptyState";
import { useBookmarks } from "../../hooks/content/useBookmarks";
import type { Post } from "../../hooks/content/usePosts";
import type { ContentConfig } from "../../templates/types";
import type { Theme } from "../../BaseAuthenticatedApp";

type Props = {
  config: ContentConfig;
  theme: Theme;
  onPress: (post: Post) => void;
};

export function ContentBookmarksScreen({ config, theme, onPress }: Props) {
  const { bookmarks, loading, refetch } = useBookmarks();

  const formatDate = useCallback((iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <Pressable
        style={[styles.card, { backgroundColor: theme.background }]}
        onPress={() => onPress(item)}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.cardImage} />
        ) : null}
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          {item.excerpt ? (
            <Text style={[styles.cardExcerpt, { color: theme.mutedText }]} numberOfLines={3}>
              {item.excerpt}
            </Text>
          ) : null}
          <Text style={[styles.cardDate, { color: theme.mutedText }]}>
            {formatDate(item.published_at)}
          </Text>
        </View>
      </Pressable>
    ),
    [theme, onPress, formatDate]
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={bookmarks}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      onRefresh={refetch}
      refreshing={loading}
      ListEmptyComponent={
        <EmptyState
          title="No saved articles yet"
          subtitle="Bookmark articles to find them here later."
          theme={theme}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cardImage: {
    width: "100%",
    height: 180,
  },
  cardBody: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 6,
  },
  cardExcerpt: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 12,
  },
});
