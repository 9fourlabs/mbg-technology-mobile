import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Theme } from "../utils/theme";
import type { TemplateAction, TemplateCard as TemplateCardType } from "../templates/types";

type Props = {
  card: TemplateCardType;
  theme: Theme;
  onAction: (action: TemplateAction) => void;
};

export function TemplateCard({ card, theme, onAction }: Props) {
  const action = card.action?.type === "open_url" ? card.action : null;
  const actionVariant = action?.variant ?? "secondary";
  const isPrimary = actionVariant === "primary";

  // Derive card style from cardRadius token:
  //   0  = flat (no border, no shadow, just background)
  //   2  = sharp (thin border, no rounding)
  //   16 = rounded (border + borderRadius)
  const isFlat = theme.cardRadius === 0;
  const cardStyle = {
    borderRadius: theme.cardRadius,
    borderWidth: isFlat ? 0 : 1,
    borderColor: isFlat ? undefined : theme.border,
    backgroundColor: theme.card,
  };

  return (
    <View style={[styles.card, cardStyle]}>
      {card.imageUri ? (
        <Image source={{ uri: card.imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: theme.placeholder }]} />
      )}

      <View style={styles.body}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>{card.title}</Text>
          <Text style={[styles.text, { color: theme.mutedText, fontSize: theme.bodySize }]}>{card.body}</Text>
        </View>

        {action ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onAction(action)}
            style={[
              styles.cta,
              { borderRadius: theme.buttonRadius },
              isPrimary
                ? { backgroundColor: theme.primary }
                : { borderColor: theme.primary, borderWidth: 1, backgroundColor: "transparent" },
            ]}
          >
            <Text style={[styles.ctaText, isPrimary ? { color: theme.background } : { color: theme.primary }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
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
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
