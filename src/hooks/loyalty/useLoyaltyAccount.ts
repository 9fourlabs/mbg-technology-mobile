import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";

export type LoyaltyAccount = {
  id: string;
  points_balance: number;
  lifetime_points: number;
  tier: string;
};

export function useLoyaltyAccount() {
  const { supabase, user } = useAuth();
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Try to fetch existing account
      const { data, error: fetchErr } = await supabase
        .from("loyalty_accounts")
        .select("id, points_balance, lifetime_points, tier")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchErr) {
        setError(fetchErr.message);
        setLoading(false);
        return;
      }

      if (data) {
        setAccount(data);
        setLoading(false);
        return;
      }

      // No account exists, create one via upsert
      const { data: created, error: createErr } = await supabase
        .from("loyalty_accounts")
        .upsert(
          {
            user_id: user.id,
            points_balance: 0,
            lifetime_points: 0,
            tier: "member",
          },
          { onConflict: "user_id" }
        )
        .select("id, points_balance, lifetime_points, tier")
        .single();

      if (createErr) {
        setError(createErr.message);
      } else {
        setAccount(created);
      }
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { account, loading, error, refetch: fetch };
}
