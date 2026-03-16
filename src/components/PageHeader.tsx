import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  body: string;
};

export function PageHeader({ title, body }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },
  body: {
    color: "#999",
    fontSize: 16,
    lineHeight: 24,
  },
});

