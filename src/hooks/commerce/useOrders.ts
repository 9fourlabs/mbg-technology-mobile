import { useAuth } from "../../auth/AuthProvider";
import { useSupabaseQuery } from "../useSupabaseQuery";

export type Order = {
  id: string;
  status: string;
  total: number;
  created_at: string;
};

export function useOrders() {
  const { user } = useAuth();

  const { data, loading, error, refetch } = useSupabaseQuery<Order[]>(
    (supabase) => {
      if (!user) return Promise.resolve({ data: [], error: null });
      return supabase
        .from("orders")
        .select("id, status, total, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
    },
    [user?.id],
  );

  return { data: data ?? [], loading, error, refetch };
}
