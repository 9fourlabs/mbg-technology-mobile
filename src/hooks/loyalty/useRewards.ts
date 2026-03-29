import { useSupabaseQuery } from "../useSupabaseQuery";

export type Reward = {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  image_url: string | null;
  stock: number | null;
};

export function useRewards() {
  const { data, loading, error, refetch } = useSupabaseQuery<Reward[]>(
    (supabase) =>
      supabase
        .from("loyalty_rewards")
        .select("id, name, description, points_cost, image_url, stock")
        .eq("active", true)
        .order("points_cost", { ascending: true })
  );

  return { data: data ?? [], loading, error, refetch };
}
