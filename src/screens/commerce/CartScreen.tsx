import React from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Theme } from "../../BaseAuthenticatedApp";
import type { CommerceConfig } from "../../templates/types";
import { useCart, type CartItem } from "../../hooks/commerce/useCart";
import { ThemedButton } from "../../components/ThemedButton";
import { EmptyState } from "../../components/EmptyState";

type Props = {
  config: CommerceConfig;
  theme: Theme;
  onCheckout: () => void;
};

export function CartScreen({ config, theme, onCheckout }: Props) {
  const { items, removeItem, updateQuantity, getTotal } = useCart();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: config.currency,
    }).format(price);

  const subtotal = getTotal();
  const tax = config.taxRate ? subtotal * config.taxRate : 0;
  const total = subtotal + tax;

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        subtitle="Browse the shop to add items"
        theme={theme}
      />
    );
  }

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={[styles.itemCard, { borderColor: theme.mutedText + "30" }]}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.itemImage}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[styles.itemImagePlaceholder, { backgroundColor: theme.mutedText + "20" }]}
        />
      )}

      <View style={styles.itemDetails}>
        <Text
          style={[styles.itemName, { color: theme.text }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <Text style={[styles.itemPrice, { color: theme.primary }]}>
          {formatPrice(item.price)}
        </Text>

        <View style={styles.quantityRow}>
          <Pressable
            style={[styles.qtyButton, { borderColor: theme.mutedText + "40" }]}
            onPress={() => updateQuantity(item.productId, item.quantity - 1)}
          >
            <Text style={[styles.qtyButtonText, { color: theme.text }]}>
              -
            </Text>
          </Pressable>
          <Text style={[styles.qtyText, { color: theme.text }]}>
            {item.quantity}
          </Text>
          <Pressable
            style={[styles.qtyButton, { borderColor: theme.mutedText + "40" }]}
            onPress={() => updateQuantity(item.productId, item.quantity + 1)}
          >
            <Text style={[styles.qtyButtonText, { color: theme.text }]}>
              +
            </Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        style={styles.removeButton}
        onPress={() => removeItem(item.productId)}
      >
        <Text style={styles.removeText}>Remove</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.summary, { borderColor: theme.mutedText + "30" }]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>
            Subtotal
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {formatPrice(subtotal)}
          </Text>
        </View>

        {config.taxRate ? (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.mutedText }]}>
              Tax ({(config.taxRate * 100).toFixed(1)}%)
            </Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>
              {formatPrice(tax)}
            </Text>
          </View>
        ) : null}

        <View style={styles.summaryRow}>
          <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
          <Text style={[styles.totalValue, { color: theme.text }]}>
            {formatPrice(total)}
          </Text>
        </View>

        <ThemedButton title="Checkout" onPress={onCheckout} theme={theme} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingBottom: 8,
  },
  itemCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  itemImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  qtyText: {
    fontSize: 14,
    fontWeight: "600",
    minWidth: 20,
    textAlign: "center",
  },
  removeButton: {
    alignSelf: "flex-start",
    marginLeft: 8,
  },
  removeText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "500",
  },
  summary: {
    borderTopWidth: 1,
    padding: 16,
    paddingBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
});
