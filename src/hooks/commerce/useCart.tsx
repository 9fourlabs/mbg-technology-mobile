import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Product } from "./useProducts";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
};

type CartState = {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
};

const CartContext = createContext<CartState>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getTotal: () => 0,
  getItemCount: () => 0,
});

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          imageUrl: product.image_url,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: qty } : i,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getTotal = useCallback(() => {
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, i) => sum + i.quantity, 0);
  }, [items]);

  const value = useMemo<CartState>(
    () => ({ items, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount }),
    [items, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
