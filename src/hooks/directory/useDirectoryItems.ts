import { useSupabaseQuery } from "../useSupabaseQuery";
import type { DirectoryFieldDef } from "../../templates/types";

export type DirectoryItem = {
  id: string;
  name: string;
  image_url: string | null;
  category_id: string | null;
  data: Record<string, any>;
};

export function useDirectoryItems(
  searchQuery: string,
  categoryId: string | null,
  fields: DirectoryFieldDef[]
) {
  const searchableKeys = fields
    .filter((f) => f.searchable)
    .map((f) => f.key);

  return useSupabaseQuery<DirectoryItem[]>(
    (supabase) => {
      let query = supabase
        .from("directory_items")
        .select("*")
        .order("name", { ascending: true });

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const trimmed = searchQuery.trim();
      if (trimmed) {
        // Build OR filter: name ilike OR each searchable JSONB field ilike
        const filters = [`name.ilike.%${trimmed}%`];
        for (const key of searchableKeys) {
          filters.push(`data->>${key}.ilike.%${trimmed}%`);
        }
        query = query.or(filters.join(","));
      }

      return query;
    },
    [searchQuery, categoryId ?? "", searchableKeys.join(",")]
  );
}
