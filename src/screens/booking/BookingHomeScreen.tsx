import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { Theme } from "../../BaseAuthenticatedApp";
import type { BookingConfig, BookingService } from "../../templates/types";

type Props = {
  config: BookingConfig;
  theme: Theme;
  onBook: (serviceId: string) => void;
};

export function BookingHomeScreen({ config, theme, onBook }: Props) {
  const formatPrice = (price?: number) => {
    if (price == null) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const renderService = ({ item }: { item: BookingService }) => (
    <View style={[styles.card, { borderColor: theme.mutedText + "30" }]}>
      <View style={styles.cardContent}>
        <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
        {item.description ? (
          <Text style={[styles.description, { color: theme.mutedText }]}>
            {item.description}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <Text style={[styles.duration, { color: theme.mutedText }]}>
            {item.duration} min
          </Text>
          {item.price != null ? (
            <Text style={[styles.price, { color: theme.text }]}>
              {formatPrice(item.price)}
            </Text>
          ) : null}
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.bookButton,
          { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={() => onBook(item.id)}
      >
        <Text style={styles.bookButtonText}>Book</Text>
      </Pressable>
    </View>
  );

  return (
    <FlatList
      data={config.services}
      keyExtractor={(item) => item.id}
      renderItem={renderService}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 18,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  duration: {
    fontSize: 13,
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
  },
  bookButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
