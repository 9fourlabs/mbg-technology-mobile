import React, { useCallback, useState } from "react";
import { Alert } from "react-native";
import BaseAuthenticatedApp, { type Theme } from "./BaseAuthenticatedApp";
import type { CommerceTemplate } from "./templates/types";
import { CartProvider, useCart } from "./hooks/commerce/useCart";
import { useCheckout } from "./hooks/commerce/useCheckout";
import { ProductCatalogScreen } from "./screens/commerce/ProductCatalogScreen";
import { ProductDetailScreen } from "./screens/commerce/ProductDetailScreen";
import { CartScreen } from "./screens/commerce/CartScreen";
import { OrderHistoryScreen } from "./screens/commerce/OrderHistoryScreen";

type ShopStep =
  | { screen: "catalog" }
  | { screen: "detail"; productId: string };

type Props = {
  config: CommerceTemplate;
};

function CommerceInner({ config }: Props) {
  const [shopStep, setShopStep] = useState<ShopStep>({ screen: "catalog" });
  const { items, clearCart } = useCart();
  const { checkout, loading: checkoutLoading } = useCheckout();

  const handleCheckout = useCallback(async () => {
    const orderId = await checkout(items);
    if (orderId) {
      clearCart();
      Alert.alert(
        "Order Placed",
        "Your order has been submitted successfully.",
      );
    }
  }, [checkout, items, clearCart]);

  const renderTab = useCallback(
    (tabId: string, theme: Theme, _navigation: any) => {
      if (tabId === "shop") {
        switch (shopStep.screen) {
          case "catalog":
            return (
              <ProductCatalogScreen
                config={config.commerce}
                theme={theme}
                onProductPress={(id) =>
                  setShopStep({ screen: "detail", productId: id })
                }
              />
            );
          case "detail":
            return (
              <ProductDetailScreen
                productId={shopStep.productId}
                config={config.commerce}
                theme={theme}
              />
            );
        }
      }

      if (tabId === "cart") {
        return (
          <CartScreen
            config={config.commerce}
            theme={theme}
            onCheckout={handleCheckout}
          />
        );
      }

      if (tabId === "orders") {
        return (
          <OrderHistoryScreen
            theme={theme}
            currency={config.commerce.currency}
          />
        );
      }

      return null;
    },
    [shopStep, config.commerce, handleCheckout],
  );

  return (
    <BaseAuthenticatedApp
      brand={config.brand}
      auth={config.auth}
      tabs={config.tabs}
      protectedTabs={config.protectedTabs}
      renderTab={renderTab}
    />
  );
}

export default function CommerceTemplateApp({ config }: Props) {
  return (
    <CartProvider>
      <CommerceInner config={config} />
    </CartProvider>
  );
}
