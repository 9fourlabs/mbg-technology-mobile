import { useSupabaseQuery } from "../useSupabaseQuery";
import type { DirectoryItem } from "./useDirectoryItems";

export function useDirectoryItem(itemId: string) {
  return useSupabaseQuery<DirectoryItem>(
    (supabase) =>
      supabase.from("directory_items").select("*").eq("id", itemId).single(),
    [itemId]
  );
}
