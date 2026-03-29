import React from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Theme } from "../../BaseAuthenticatedApp";
import type { CommerceConfig } from "../../templates/types";
import { useProduct } from "../../hooks/commerce/useProduct";
import { useCart } from "../../hooks/commerce/useCart";
import { ThemedButton } from "../../components/ThemedButton";

type Props = {
  productId: string;
  config: CommerceConfig;
  theme: Theme;
};

const LOW_STOCK_THRESHOLD = 5;

export function ProductDetailScreen({ productId, config, theme }: Props) {
  const { data: product, loading, error } = useProduct(productId);
  const { addItem } = useCart();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: config.currency,
    }).format(price);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: "#dc2626" }}>{error ?? "Product not found"}</Text>
      </View>
    );
  }

  const isLowStock = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
  const isOutOfStock = product.stock === 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {product.image_url ? (
        <Image
          source={{ uri: product.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[styles.imagePlaceholder, { backgroundColor: theme.mutedText + "20" }]}
        />
      )}

      <View style={styles.details}>
        <Text style={[styles.name, { color: theme.text }]}>
          {product.name}
        </Text>

        <Text style={[styles.price, { color: theme.primary }]}>
          {formatPrice(product.price)}
        </Text>

        {isLowStock ? (
          <Text style={styles.lowStock}>
            Only {product.stock} left in stock
          </Text>
        ) : null}

        {isOutOfStock ? (
          <Text style={styles.outOfStock}>Out of stock</Text>
        ) : null}

        {product.description ? (
          <Text style={[styles.description, { color: theme.mutedText }]}>
            {product.description}
          </Text>
        ) : null}

        <View style={styles.buttonWrapper}>
          <ThemedButton
            title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
            onPress={() => addItem(product)}
            disabled={isOutOfStock}
            theme={theme}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 300,
  },
  imagePlaceholder: {
    width: "100%",
    height: 300,
  },
  details: {
    padding: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  lowStock: {
    color: "#f59e0b",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  outOfStock: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonWrapper: {
    marginTop: 8,
  },
});
