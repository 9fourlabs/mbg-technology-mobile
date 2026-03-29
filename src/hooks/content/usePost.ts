import { useSupabaseQuery } from "../useSupabaseQuery";
import type { Post } from "./usePosts";

export function usePost(postId: string) {
  return useSupabaseQuery<Post>(
    (supabase) =>
      supabase.from("posts").select("*").eq("id", postId).single(),
    [postId]
  );
}
