import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { pbGet } from "../../data/pocketbaseClient";
import type { Post } from "./usePosts";

type Result = {
  data: Post | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

/**
 * Fetch a single post by ID. Mirrors usePosts in dispatching between
 * Supabase and Pocketbase based on the tenant's backend.
 */
export function usePost(postId: string): Result {
  const { backend, supabase } = useAuth();
  const [data, setData] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async (): Promise<Post> => {
    if (backend.kind === "pocketbase") {
      const r = await pbGet<Post>(backend.pocketbaseUrl, "posts", postId);
      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        excerpt: r.excerpt,
        body: r.body,
        image_url: r.image_url,
        category_id: r.category_id,
        published_at: r.published_at,
      };
    }
    const { data: row, error: err } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .single();
    if (err) throw err;
    return row as Post;
  }, [backend, supabase, postId]);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchPost());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [fetchPost]);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}
