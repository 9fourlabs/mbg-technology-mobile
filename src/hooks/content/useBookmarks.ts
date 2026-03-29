import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import type { Post } from "./usePosts";

export function useBookmarks() {
  const { supabase, user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("bookmarks")
      .select("post_id, posts(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBookmarks(
        data
          .map((row: any) => row.posts as Post)
          .filter(Boolean)
      );
    }
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.map((p) => p.id)),
    [bookmarks]
  );

  const isBookmarked = useCallback(
    (postId: string) => bookmarkedIds.has(postId),
    [bookmarkedIds]
  );

  const toggle = useCallback(
    async (postId: string) => {
      if (!user) return;

      if (bookmarkedIds.has(postId)) {
        await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);
      } else {
        await supabase
          .from("bookmarks")
          .insert({ user_id: user.id, post_id: postId });
      }

      await fetchBookmarks();
    },
    [supabase, user, bookmarkedIds, fetchBookmarks]
  );

  return { bookmarks, loading, toggle, isBookmarked, refetch: fetchBookmarks };
}
