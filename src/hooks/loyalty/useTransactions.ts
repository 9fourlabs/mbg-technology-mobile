import { useAuth } from "../../auth/AuthProvider";
import { useSupabaseQuery } from "../useSupabaseQuery";

export type Transaction = {
  id: string;
  type: string;
  points: number;
  description: string;
  created_at: string;
};

export function useTransactions() {
  const { user } = useAuth();

  const { data, loading, error, refetch } = useSupabaseQuery<Transaction[]>(
    (supabase) =>
      supabase
        .from("loyalty_transactions")
        .select("id, type, points, description, created_at")
        .eq("user_id", user?.id ?? "")
        .order("created_at", { ascending: false }),
    [user?.id]
  );

  return { data: data ?? [], loading, error, refetch };
}
