import { useSupabaseQuery } from "../useSupabaseQuery";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  stock: number;
};

export function useProducts(categoryId?: string | null, search?: string) {
  const { data, loading, error, refetch } = useSupabaseQuery<Product[]>(
    (supabase) => {
      let query = supabase.from("products").select("*").order("name");

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }
      if (search && search.trim().length > 0) {
        query = query.ilike("name", `%${search.trim()}%`);
      }

      return query;
    },
    [categoryId, search],
  );

  return { data: data ?? [], loading, error, refetch };
}
