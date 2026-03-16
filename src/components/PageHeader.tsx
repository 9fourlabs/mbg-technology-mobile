import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  body: string;
  colors: {
    text: string;
    muted: string;
  };
};

export function PageHeader({ title, body, colors }: Props) {
  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.muted }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
});

