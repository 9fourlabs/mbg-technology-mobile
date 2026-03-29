import { useCallback, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import type { SupabaseClient } from "@supabase/supabase-js";

type Result<TInput, TOutput> = {
  mutate: (input: TInput) => Promise<TOutput | null>;
  loading: boolean;
  error: string | null;
};

export function useSupabaseMutation<TInput, TOutput>(
  mutationFn: (supabase: SupabaseClient, input: TInput) => PromiseLike<{ data: TOutput | null; error: any }>
): Result<TInput, TOutput> {
  const { supabase } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (input: TInput): Promise<TOutput | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await mutationFn(supabase, input);
        if (result.error) {
          setError(result.error.message ?? String(result.error));
          return null;
        }
        return result.data;
      } catch (e: any) {
        setError(e.message ?? "Unknown error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase, mutationFn]
  );

  return { mutate, loading, error };
}
