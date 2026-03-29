import { useSupabaseQuery } from "../useSupabaseQuery";

export type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number | null;
  active: boolean;
  sort_order: number;
};

export function useServices() {
  const { data, loading, error, refetch } = useSupabaseQuery<Service[]>(
    (supabase) =>
      supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true }),
  );

  return { data: data ?? [], loading, error, refetch };
}
