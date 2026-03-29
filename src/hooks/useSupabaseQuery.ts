import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import type { SupabaseClient } from "@supabase/supabase-js";

type Result<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useSupabaseQuery<T>(
  queryFn: (supabase: SupabaseClient) => PromiseLike<{ data: T | null; error: any }>,
  deps: any[] = []
): Result<T> {
  const { supabase } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await queryFn(supabase);
      if (result.error) {
        setError(result.error.message ?? String(result.error));
        setData(null);
      } else {
        setData(result.data);
      }
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
      setData(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, ...deps]);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}
