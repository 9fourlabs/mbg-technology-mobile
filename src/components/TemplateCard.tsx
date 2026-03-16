import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { TemplateAction, TemplateCard as TemplateCardType } from "../templates/types";

type Props = {
  card: TemplateCardType;
  theme: {
    primary: string;
    background: string;
    text: string;
    mutedText: string;
  };
  onAction: (action: TemplateAction) => void;
};

export function TemplateCard({ card, theme, onAction }: Props) {
  const hasAction = card.action && card.action.type !== "none";
  const actionVariant = hasAction ? card.action?.variant ?? "secondary" : "secondary";
  const isPrimary = actionVariant === "primary";

  return (
    <View style={[styles.card, { borderColor: "#1a1a1a", backgroundColor: "#0d0d0d" }]}>
      {card.imageUri ? (
        <Image source={{ uri: card.imageUri }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder} />
      )}

      <View style={styles.body}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>{card.title}</Text>
          <Text style={[styles.text, { color: "#aaa" }]}>{card.body}</Text>
        </View>

        {hasAction && card.action ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onAction(card.action!)}
            style={[
              styles.cta,
              isPrimary
                ? { backgroundColor: theme.primary }
                : { borderColor: theme.primary, borderWidth: 1, backgroundColor: "transparent" },
            ]}
          >
            <Text style={[styles.ctaText, isPrimary ? { color: theme.background } : { color: theme.primary }]}>
              {card.action.label}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    minHeight: 260,
  },
  image: {
    width: "100%",
    height: 120,
  },
  imagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: "#111111",
  },
  body: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  cta: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "700",
  },
});

