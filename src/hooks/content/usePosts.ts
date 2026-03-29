import { useSupabaseQuery } from "../useSupabaseQuery";

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

export function usePosts(categoryId?: string | null) {
  return useSupabaseQuery<Post[]>(
    (supabase) => {
      let query = supabase
        .from("posts")
        .select("*")
        .order("published_at", { ascending: false });

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      return query;
    },
    [categoryId ?? ""]
  );
}
