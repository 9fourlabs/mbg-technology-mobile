import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  body: string;
  colors: {
    text: string;
    muted: string;
  };
  headerAlign?: "center" | "flex-start";
  headingSize?: number;
  bodySize?: number;
};

export function PageHeader({ title, body, colors, headerAlign, headingSize, bodySize }: Props) {
  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.title,
          { color: colors.text },
          headerAlign != null && { textAlign: headerAlign === "center" ? "center" : "left" },
          headingSize != null && { fontSize: headingSize },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.body,
          { color: colors.muted },
          headerAlign != null && { textAlign: headerAlign === "center" ? "center" : "left" },
          bodySize != null && { fontSize: bodySize },
        ]}
      >
        {body}
      </Text>
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

