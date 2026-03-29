import { useAuth } from "../../auth/AuthProvider";
import { useSupabaseQuery } from "../useSupabaseQuery";

export type Submission = {
  id: string;
  form_id: string;
  data: Record<string, any>;
  status: string;
  created_at: string;
};

export function useSubmissions() {
  const { user } = useAuth();

  const { data, loading, error, refetch } = useSupabaseQuery<Submission[]>(
    (supabase) =>
      supabase
        .from("form_submissions")
        .select("id, form_id, data, status, created_at")
        .eq("user_id", user?.id ?? "")
        .order("created_at", { ascending: false }),
    [user?.id]
  );

  return { data: data ?? [], loading, error, refetch };
}
