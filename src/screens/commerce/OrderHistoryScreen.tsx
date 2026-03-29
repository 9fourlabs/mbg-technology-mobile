import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Theme } from "../../BaseAuthenticatedApp";
import { useOrders, type Order } from "../../hooks/commerce/useOrders";
import { Badge } from "../../components/Badge";
import { EmptyState } from "../../components/EmptyState";

type Props = {
  theme: Theme;
  currency?: string;
};

function statusColor(status: string): string {
  switch (status) {
    case "completed":
    case "delivered":
      return "#16a34a";
    case "cancelled":
    case "refunded":
      return "#dc2626";
    case "pending":
      return "#f59e0b";
    case "processing":
    case "shipped":
      return "#3b82f6";
    default:
      return "#6b7280";
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncateId(id: string): string {
  return id.length > 8 ? id.slice(0, 8) + "..." : id;
}

export function OrderHistoryScreen({ theme, currency = "USD" }: Props) {
  const { data: orders, loading, error } = useOrders();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(price);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: "#dc2626" }}>{error}</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        title="No orders yet"
        subtitle="Your order history will appear here"
        theme={theme}
      />
    );
  }

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={[styles.card, { borderColor: theme.mutedText + "30" }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.orderId, { color: theme.mutedText }]}>
          #{truncateId(item.id)}
        </Text>
        <Badge
          label={item.status}
          color={statusColor(item.status)}
          theme={theme}
        />
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.date, { color: theme.mutedText }]}>
          {formatDate(item.created_at)}
        </Text>
        <Text style={[styles.total, { color: theme.text }]}>
          {formatPrice(item.total)}
        </Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={renderOrder}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  orderId: {
    fontSize: 13,
    fontWeight: "500",
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 13,
  },
  total: {
    fontSize: 16,
    fontWeight: "700",
  },
});
