import { useCallback, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";

export function useBookSlot() {
  const { supabase } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const book = useCallback(
    async (
      serviceId: string,
      slotId: string,
      notes?: string,
    ): Promise<string | null> => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: rpcError } = await supabase.rpc("book_time_slot", {
          p_service_id: serviceId,
          p_slot_id: slotId,
          p_notes: notes ?? null,
        });
        if (rpcError) {
          setError(rpcError.message);
          return null;
        }
        return data as string;
      } catch (e: any) {
        setError(e.message ?? "Failed to book slot");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  return { book, loading, error };
}
