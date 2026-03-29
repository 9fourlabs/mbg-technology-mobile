import React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { usePost } from "../../hooks/content/usePost";
import { useBookmarks } from "../../hooks/content/useBookmarks";
import type { ContentConfig } from "../../templates/types";
import type { Theme } from "../../BaseAuthenticatedApp";

type Props = {
  postId: string;
  config: ContentConfig;
  theme: Theme;
  onBack: () => void;
};

export function ContentDetailScreen({ postId, config, theme, onBack }: Props) {
  const { data: post, loading } = usePost(postId);
  const { isBookmarked, toggle } = useBookmarks();

  const bookmarked = isBookmarked(postId);

  if (loading || !post) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const formattedDate = new Date(post.published_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backText, { color: theme.primary }]}>{"< Back"}</Text>
        </Pressable>
        {config.allowBookmarks && (
          <Pressable onPress={() => toggle(postId)} style={styles.bookmarkButton}>
            <Text style={styles.bookmarkIcon}>{bookmarked ? "\u2665" : "\u2661"}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {post.image_url ? (
          <Image source={{ uri: post.image_url }} style={styles.heroImage} />
        ) : null}

        <Text style={[styles.title, { color: theme.text }]}>{post.title}</Text>
        <Text style={[styles.date, { color: theme.mutedText }]}>{formattedDate}</Text>
        <Text style={[styles.body, { color: theme.text }]}>{post.body}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: { padding: 4 },
  backText: { fontSize: 16, fontWeight: "500" },
  bookmarkButton: { padding: 4 },
  bookmarkIcon: { fontSize: 24, color: "#e74c3c" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32 },
  heroImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  date: {
    fontSize: 13,
    marginBottom: 20,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
});
