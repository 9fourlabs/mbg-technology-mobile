import { useCallback, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import type { CartItem } from "./useCart";

export function useCheckout() {
  const { supabase, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = useCallback(
    async (items: CartItem[]): Promise<string | null> => {
      if (!user) {
        setError("You must be signed in to checkout");
        return null;
      }
      if (items.length === 0) {
        setError("Cart is empty");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const total = items.reduce(
          (sum, i) => sum + i.price * i.quantity,
          0,
        );

        // Create order
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            status: "pending",
            total,
          })
          .select("id")
          .single();

        if (orderError) {
          setError(orderError.message);
          return null;
        }

        // Create order items
        const orderItems = items.map((item) => ({
          order_id: order.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.price,
          line_total: item.price * item.quantity,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) {
          setError(itemsError.message);
          return null;
        }

        return order.id as string;
      } catch (e: any) {
        setError(e.message ?? "Checkout failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase, user],
  );

  return { checkout, loading, error };
}
