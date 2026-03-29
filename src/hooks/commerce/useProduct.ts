import { useSupabaseQuery } from "../useSupabaseQuery";
import type { Product } from "./useProducts";

export function useProduct(productId: string | null) {
  const { data, loading, error } = useSupabaseQuery<Product>(
    (supabase) => {
      if (!productId) {
        return Promise.resolve({ data: null, error: null });
      }
      return supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();
    },
    [productId],
  );

  return { data, loading, error };
}
