import { useCallback, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";

export function useCancelBooking() {
  const { supabase } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = useCallback(
    async (bookingId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const { error: updateError } = await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", bookingId);
        if (updateError) {
          setError(updateError.message);
          return false;
        }
        return true;
      } catch (e: any) {
        setError(e.message ?? "Failed to cancel booking");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase],
  );

  return { cancel, loading, error };
}
