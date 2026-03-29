import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Theme } from "../../BaseAuthenticatedApp";
import { useTransactions } from "../../hooks/loyalty/useTransactions";

type Props = {
  theme: Theme;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TransactionsScreen({ theme }: Props) {
  const { data, loading, error, refetch } = useTransactions();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#e53e3e" }}>{error}</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No Transactions Yet</Text>
        <Text style={[styles.emptyBody, { color: theme.mutedText }]}>
          Your points activity will appear here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      onRefresh={refetch}
      refreshing={loading}
      renderItem={({ item }) => {
        const isEarn = item.points > 0;
        const pointsColor = isEarn ? "#38a169" : "#e53e3e";
        const prefix = isEarn ? "+" : "";

        return (
          <View style={[styles.txItem, { borderColor: theme.primary + "30" }]}>
            <View style={styles.txContent}>
              <Text style={[styles.txDescription, { color: theme.text }]}>
                {item.description}
              </Text>
              <Text style={[styles.txDate, { color: theme.mutedText }]}>
                {formatDate(item.created_at)}
              </Text>
            </View>
            <Text style={[styles.txPoints, { color: pointsColor }]}>
              {prefix}{item.points.toLocaleString()}
            </Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  list: {
    padding: 20,
  },
  txItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  txContent: {
    flex: 1,
  },
  txDescription: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  txDate: {
    fontSize: 13,
  },
  txPoints: {
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
