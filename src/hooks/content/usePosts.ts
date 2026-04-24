import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { pbList } from "../../data/pocketbaseClient";

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  image_url: string | null;
  category_id: string | null;
  published_at: string;
};

type Result = {
  data: Post[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

/**
 * Fetch published posts for the current tenant. Dispatches to either
 * Supabase (`posts` table) or Pocketbase (`posts` collection) based on
 * what the tenant config sets — see resolveTenantBackend.
 */
export function usePosts(categoryId?: string | null): Result {
  const { backend, supabase } = useAuth();
  const [data, setData] = useState<Post[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (): Promise<Post[]> => {
    if (backend.kind === "pocketbase") {
      // PB filter syntax + sort.
      const filterParts: string[] = ["published = true"];
      if (categoryId) filterParts.push(`category_id = "${categoryId}"`);
      const result = await pbList<Post>(
        backend.pocketbaseUrl,
        "posts",
        {
          filter: filterParts.join(" && "),
          sort: "-published_at",
          perPage: 100,
        },
      );
      return result.items.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        excerpt: r.excerpt,
        body: r.body,
        image_url: r.image_url,
        category_id: r.category_id,
        published_at: r.published_at,
      }));
    }

    // Supabase path
    let query = supabase
      .from("posts")
      .select("*")
      .order("published_at", { ascending: false });
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }
    const { data: rows, error: err } = await query;
    if (err) throw err;
    return (rows ?? []) as Post[];
  }, [backend, supabase, categoryId]);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchPosts());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [fetchPosts]);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}
