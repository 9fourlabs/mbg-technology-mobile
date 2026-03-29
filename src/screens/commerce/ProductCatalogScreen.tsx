import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Theme } from "../../BaseAuthenticatedApp";
import type { CommerceConfig } from "../../templates/types";
import { useProducts, type Product } from "../../hooks/commerce/useProducts";
import { SearchBar } from "../../components/SearchBar";
import { CategoryFilter } from "../../components/CategoryFilter";
import { EmptyState } from "../../components/EmptyState";

type Props = {
  config: CommerceConfig;
  theme: Theme;
  onProductPress: (id: string) => void;
};

const CARD_GAP = 12;
const HORIZONTAL_PADDING = 16;
const screenWidth = Dimensions.get("window").width;
const cardWidth =
  (screenWidth - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

export function ProductCatalogScreen({ config, theme, onProductPress }: Props) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const { data: products, loading, error } = useProducts(categoryId, search);

  const formatPrice = useCallback(
    (price: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: config.currency,
      }).format(price),
    [config.currency],
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          width: cardWidth,
          borderColor: theme.mutedText + "30",
          opacity: pressed ? 0.8 : 1,
        },
      ]}
      onPress={() => onProductPress(item.id)}
    >
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[styles.cardImagePlaceholder, { backgroundColor: theme.mutedText + "20" }]}
        />
      )}
      <View style={styles.cardBody}>
        <Text
          style={[styles.productName, { color: theme.text }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <Text style={[styles.productPrice, { color: theme.primary }]}>
          {formatPrice(item.price)}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <SearchBar
        placeholder="Search products..."
        onSearch={setSearch}
        theme={theme}
      />

      {config.categories.length > 0 ? (
        <CategoryFilter
          categories={config.categories}
          activeId={categoryId}
          onSelect={setCategoryId}
          theme={theme}
        />
      ) : null}

      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.primary}
          style={styles.loader}
        />
      ) : error ? (
        <Text style={[styles.errorText, { color: "#dc2626" }]}>{error}</Text>
      ) : products.length === 0 ? (
        <EmptyState
          title="No products found"
          subtitle="Try a different search or category"
          theme={theme}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginTop: 32,
  },
  errorText: {
    paddingHorizontal: 16,
    marginTop: 16,
    fontSize: 14,
  },
  list: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 32,
  },
  row: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: cardWidth,
  },
  cardImagePlaceholder: {
    width: "100%",
    height: cardWidth,
  },
  cardBody: {
    padding: 10,
  },
  productName: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "700",
  },
});
