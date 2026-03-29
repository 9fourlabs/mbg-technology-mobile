import { useCallback, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";

export function useRedeemReward() {
  const { supabase, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redeem = useCallback(
    async (rewardId: string, pointsCost: number): Promise<boolean> => {
      if (!user) {
        setError("Not authenticated");
        return false;
      }
      setLoading(true);
      setError(null);

      try {
        // Check current balance first
        const { data: account, error: fetchErr } = await supabase
          .from("loyalty_accounts")
          .select("points_balance")
          .eq("user_id", user.id)
          .single();

        if (fetchErr) {
          setError(fetchErr.message);
          return false;
        }

        if (!account || account.points_balance < pointsCost) {
          setError("Insufficient points");
          return false;
        }

        // Insert redemption transaction
        const { error: txErr } = await supabase
          .from("loyalty_transactions")
          .insert({
            user_id: user.id,
            type: "redeem",
            points: -pointsCost,
            description: `Redeemed reward ${rewardId}`,
            reward_id: rewardId,
          });

        if (txErr) {
          setError(txErr.message);
          return false;
        }

        // Decrement balance
        const { error: updateErr } = await supabase
          .from("loyalty_accounts")
          .update({ points_balance: account.points_balance - pointsCost })
          .eq("user_id", user.id);

        if (updateErr) {
          setError(updateErr.message);
          return false;
        }

        return true;
      } catch (e: any) {
        setError(e.message ?? "Unknown error");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase, user]
  );

  return { redeem, loading, error };
}
