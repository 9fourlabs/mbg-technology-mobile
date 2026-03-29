import React, { useCallback, useState } from "react";
import { View } from "react-native";
import BaseAuthenticatedApp, { type Theme } from "./BaseAuthenticatedApp";
import { ContentFeedScreen } from "./screens/content/ContentFeedScreen";
import { ContentDetailScreen } from "./screens/content/ContentDetailScreen";
import { ContentBookmarksScreen } from "./screens/content/ContentBookmarksScreen";
import type { ContentTemplate } from "./templates/types";
import type { Post } from "./hooks/content/usePosts";

type Props = {
  template: ContentTemplate;
};

export default function ContentTemplateApp({ template }: Props) {
  return (
    <BaseAuthenticatedApp
      brand={template.brand}
      auth={template.auth}
      tabs={template.tabs}
      protectedTabs={template.protectedTabs}
      renderTab={(tabId, theme, _navigation) => {
        if (tabId === "feed") {
          return <FeedStack config={template.content} theme={theme} />;
        }
        if (tabId === "bookmarks") {
          return (
            <BookmarksStack config={template.content} theme={theme} />
          );
        }
        return null;
      }}
    />
  );
}

/** Local stack for feed -> detail navigation without react-navigation. */
function FeedStack({
  config,
  theme,
}: {
  config: ContentTemplate["content"];
  theme: Theme;
}) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const handlePress = useCallback((post: Post) => {
    setSelectedPost(post);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedPost(null);
  }, []);

  if (selectedPost) {
    return (
      <ContentDetailScreen
        postId={selectedPost.id}
        config={config}
        theme={theme}
        onBack={handleBack}
      />
    );
  }

  return (
    <ContentFeedScreen config={config} theme={theme} onPress={handlePress} />
  );
}

/** Local stack for bookmarks -> detail navigation. */
function BookmarksStack({
  config,
  theme,
}: {
  config: ContentTemplate["content"];
  theme: Theme;
}) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const handlePress = useCallback((post: Post) => {
    setSelectedPost(post);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedPost(null);
  }, []);

  if (selectedPost) {
    return (
      <ContentDetailScreen
        postId={selectedPost.id}
        config={config}
        theme={theme}
        onBack={handleBack}
      />
    );
  }

  return (
    <ContentBookmarksScreen config={config} theme={theme} onPress={handlePress} />
  );
}
